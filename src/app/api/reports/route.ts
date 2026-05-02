import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireApiRoles } from "@/lib/api/rbac";
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";

/** PDFKit требует Node.js runtime (не Edge). */
export const runtime = "nodejs";

const QuerySchema = z.object({
  period: z.enum(["day", "week", "month", "year"]).optional(),
  format: z.enum(["json", "pdf", "excel"]).optional(),
});

type Period = NonNullable<z.infer<typeof QuerySchema>["period"]>;

function intervalFor(period: Period) {
  if (period === "day") return { iv: "1 day", title: "День" };
  if (period === "week") return { iv: "7 day", title: "Неделя" };
  if (period === "month") return { iv: "1 month", title: "Месяц" };
  return { iv: "1 year", title: "Год" };
}

function asNumber(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

async function buildReport(period: Period) {
  const { iv, title } = intervalFor(period);

  const waterRow = (await db()
    .prepare(
      `
      SELECT COALESCE(SUM(volume_liters), 0)::float8 as liters
      FROM watering_schedule
      WHERE scheduled_at >= (NOW() AT TIME ZONE 'UTC' - ?::interval)
        AND scheduled_at <= (NOW() AT TIME ZONE 'UTC')
    `,
    )
    .get(iv)) as { liters: number };

  const taskRow = (await db()
    .prepare(
      `
      SELECT
        COUNT(*)::int as total,
        SUM(CASE WHEN is_completed = 1 THEN 1 ELSE 0 END)::int as done
      FROM tasks
      WHERE created_at >= (NOW() AT TIME ZONE 'UTC' - ?::interval)
        AND created_at <= (NOW() AT TIME ZONE 'UTC')
    `,
    )
    .get(iv)) as { total: number; done: number };

  const harvestRow = (await db()
    .prepare(
      `
      SELECT COUNT(*)::int as harvested
      FROM cultures
      WHERE harvest_date IS NOT NULL
        AND harvest_date >= (CURRENT_DATE - ?::interval)
        AND harvest_date <= CURRENT_DATE
    `,
    )
    .get(iv)) as { harvested: number };

  const byGreenhouse = (await db()
    .prepare(
      `
      SELECT
        g.id,
        g.name,
        COUNT(c.id)::int as harvested
      FROM greenhouses g
      LEFT JOIN cultures c
        ON c.greenhouse_id = g.id
        AND c.harvest_date IS NOT NULL
        AND c.harvest_date >= (CURRENT_DATE - ?::interval)
        AND c.harvest_date <= CURRENT_DATE
      GROUP BY g.id, g.name
      ORDER BY g.id ASC
    `,
    )
    .all(iv)) as Array<{ id: number; name: string; harvested: number }>;

  const totalTasks = asNumber(taskRow.total);
  const doneTasks = asNumber(taskRow.done);
  const completionPct = totalTasks ? Math.round((doneTasks / totalTasks) * 100) : 0;

  return {
    period,
    periodTitle: title,
    kpi: {
      harvested: asNumber(harvestRow.harvested),
      waterLiters: asNumber(waterRow.liters),
      tasksTotal: totalTasks,
      tasksDone: doneTasks,
      tasksCompletionPct: completionPct,
    },
    chart: {
      labels: byGreenhouse.map((x) => x.name),
      values: byGreenhouse.map((x) => asNumber(x.harvested)),
    },
    table: byGreenhouse,
    // Дополнительные данные для графиков (PowerBI‑стиль: тренды по дням)
    series: {
      waterDaily: [] as Array<{ day: string; liters: number }>,
      tasksDaily: [] as Array<{ day: string; total: number; done: number }>,
      sensorsDaily: [] as Array<{ day: string; avgTemp: number | null; avgHum: number | null }>,
    },
  };
}

async function loadWaterDaily(iv: string) {
  return (await db()
    .prepare(
      `
      SELECT
        to_char(date_trunc('day', scheduled_at AT TIME ZONE 'UTC'), 'YYYY-MM-DD') as day,
        COALESCE(SUM(volume_liters), 0)::float8 as liters
      FROM watering_schedule
      WHERE scheduled_at >= (NOW() AT TIME ZONE 'UTC' - ?::interval)
        AND scheduled_at <= (NOW() AT TIME ZONE 'UTC')
      GROUP BY 1
      ORDER BY 1 ASC
    `,
    )
    .all(iv)) as Array<{ day: string; liters: number }>;
}

async function loadTasksDaily(iv: string) {
  return (await db()
    .prepare(
      `
      SELECT
        to_char(date_trunc('day', created_at AT TIME ZONE 'UTC'), 'YYYY-MM-DD') as day,
        COUNT(*)::int as total,
        SUM(CASE WHEN is_completed = 1 THEN 1 ELSE 0 END)::int as done
      FROM tasks
      WHERE created_at >= (NOW() AT TIME ZONE 'UTC' - ?::interval)
        AND created_at <= (NOW() AT TIME ZONE 'UTC')
      GROUP BY 1
      ORDER BY 1 ASC
    `,
    )
    .all(iv)) as Array<{ day: string; total: number; done: number }>;
}

async function loadSensorsDaily(iv: string) {
  return (await db()
    .prepare(
      `
      SELECT
        to_char(date_trunc('day', recorded_at AT TIME ZONE 'UTC'), 'YYYY-MM-DD') as day,
        AVG(temperature)::float8 as "avgTemp",
        AVG(humidity)::float8 as "avgHum"
      FROM sensor_data
      WHERE recorded_at >= (NOW() AT TIME ZONE 'UTC' - ?::interval)
        AND recorded_at <= (NOW() AT TIME ZONE 'UTC')
      GROUP BY 1
      ORDER BY 1 ASC
    `,
    )
    .all(iv)) as Array<{ day: string; avgTemp: number | null; avgHum: number | null }>;
}

const thinBorder: Partial<ExcelJS.Borders> = {
  top: { style: "thin", color: { argb: "FFCCCCCC" } },
  left: { style: "thin", color: { argb: "FFCCCCCC" } },
  bottom: { style: "thin", color: { argb: "FFCCCCCC" } },
  right: { style: "thin", color: { argb: "FFCCCCCC" } },
};

const sectionFill: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FFE8F5E9" },
};

function stylePairRow(ws: ExcelJS.Worksheet, row: number, cols: number) {
  for (let c = 1; c <= cols; c++) {
    ws.getCell(row, c).border = thinBorder;
  }
}

/** PNG для вставки в Excel (Chart.js-конфиг через QuickChart). Без сети вернёт null. */
async function fetchQuickChartPng(chart: Record<string, unknown>): Promise<Buffer | null> {
  try {
    const u = new URL("https://quickchart.io/chart");
    u.searchParams.set("c", JSON.stringify(chart));
    u.searchParams.set("w", "540");
    u.searchParams.set("h", "280");
    u.searchParams.set("bkg", "#ffffff");
    const ac = new AbortController();
    const to = setTimeout(() => ac.abort(), 14_000);
    const res = await fetch(u.toString(), { signal: ac.signal });
    clearTimeout(to);
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return null;
  }
}

function shortChartLabels(names: string[], max = 18): string[] {
  return names.map((s) => (s.length <= max ? s : `${s.slice(0, max - 1)}…`));
}

async function exportExcel(report: Awaited<ReturnType<typeof buildReport>>) {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Future Greenhouse";
  wb.created = new Date();

  const ws = wb.addWorksheet("Отчёт", {
    views: [{ state: "frozen", ySplit: 2, activeCell: "A3", showGridLines: true }],
  });
  [28, 18, 14, 14, 14, 14].forEach((w, i) => {
    ws.getColumn(i + 1).width = w;
  });

  let row = 1;
  ws.mergeCells(row, 1, row, 6);
  const title = ws.getCell(row, 1);
  title.value = "Future Greenhouse — отчёт";
  title.font = { bold: true, size: 14 };
  title.alignment = { horizontal: "center", vertical: "middle" };
  row++;

  ws.getCell(row, 1).value = "Период";
  ws.getCell(row, 2).value = report.periodTitle;
  ws.getCell(row, 1).font = { bold: true };
  row++;
  row++;

  ws.mergeCells(row, 1, row, 6);
  const kpiHead = ws.getCell(row, 1);
  kpiHead.value = "KPI";
  kpiHead.font = { bold: true, size: 12 };
  kpiHead.fill = sectionFill;
  kpiHead.border = thinBorder;
  row++;

  const kpiLines: Array<[string, string | number]> = [
    ["Урожай (партий)", report.kpi.harvested],
    ["Расход воды (л)", Math.round(report.kpi.waterLiters * 100) / 100],
    ["Задачи (всего)", report.kpi.tasksTotal],
    ["Задачи (выполнено)", report.kpi.tasksDone],
    ["Выполнение задач (%)", report.kpi.tasksCompletionPct],
  ];
  for (const [k, v] of kpiLines) {
    ws.getCell(row, 1).value = k;
    ws.getCell(row, 2).value = v;
    stylePairRow(ws, row, 2);
    row++;
  }
  row++;

  ws.mergeCells(row, 1, row, 6);
  const ghHead = ws.getCell(row, 1);
  ghHead.value = "Урожай по теплицам";
  ghHead.font = { bold: true, size: 12 };
  ghHead.fill = sectionFill;
  ghHead.border = thinBorder;
  row++;

  const ghHeaderRow = row;
  ws.getCell(row, 1).value = "Теплица";
  ws.getCell(row, 2).value = "Урожай (партий)";
  ws.getRow(row).font = { bold: true };
  stylePairRow(ws, row, 2);
  row++;

  for (const r of report.table) {
    ws.getCell(row, 1).value = r.name;
    ws.getCell(row, 2).value = r.harvested;
    stylePairRow(ws, row, 2);
    row++;
  }
  const ghDataEnd = row - 1;
  if (ghDataEnd > ghHeaderRow) {
    ws.addConditionalFormatting({
      ref: `B${ghHeaderRow + 1}:B${ghDataEnd}`,
      rules: [{ type: "dataBar", priority: 1, gradient: true, cfvo: [{ type: "min" }, { type: "max" }] }],
    });
  }
  row++;

  ws.mergeCells(row, 1, row, 6);
  const wHead = ws.getCell(row, 1);
  wHead.value = "Тренд: расход воды по дням";
  wHead.font = { bold: true, size: 12 };
  wHead.fill = sectionFill;
  wHead.border = thinBorder;
  row++;

  ws.getCell(row, 1).value = "День";
  ws.getCell(row, 2).value = "Литры";
  ws.getRow(row).font = { bold: true };
  stylePairRow(ws, row, 2);
  row++;
  const waterStart = row;
  for (const r of report.series.waterDaily) {
    ws.getCell(row, 1).value = r.day;
    ws.getCell(row, 2).value = Math.round(r.liters * 100) / 100;
    stylePairRow(ws, row, 2);
    row++;
  }
  const waterEnd = row - 1;
  if (waterEnd >= waterStart) {
    ws.addConditionalFormatting({
      ref: `B${waterStart}:B${waterEnd}`,
      rules: [{ type: "dataBar", priority: 2, gradient: true, cfvo: [{ type: "min" }, { type: "max" }] }],
    });
  }
  row++;

  ws.mergeCells(row, 1, row, 6);
  const tHead = ws.getCell(row, 1);
  tHead.value = "Тренд: задачи по дням";
  tHead.font = { bold: true, size: 12 };
  tHead.fill = sectionFill;
  tHead.border = thinBorder;
  row++;

  ws.getCell(row, 1).value = "День";
  ws.getCell(row, 2).value = "Всего";
  ws.getCell(row, 3).value = "Выполнено";
  ws.getRow(row).font = { bold: true };
  stylePairRow(ws, row, 3);
  row++;
  const tasksStart = row;
  for (const r of report.series.tasksDaily) {
    ws.getCell(row, 1).value = r.day;
    ws.getCell(row, 2).value = r.total;
    ws.getCell(row, 3).value = r.done;
    stylePairRow(ws, row, 3);
    row++;
  }
  const tasksEnd = row - 1;
  if (tasksEnd >= tasksStart) {
    ws.addConditionalFormatting({
      ref: `C${tasksStart}:C${tasksEnd}`,
      rules: [{ type: "dataBar", priority: 3, gradient: true, cfvo: [{ type: "min" }, { type: "max" }] }],
    });
  }
  row++;

  ws.mergeCells(row, 1, row, 6);
  const sHead = ws.getCell(row, 1);
  sHead.value = "Тренд: датчики (средние по дням)";
  sHead.font = { bold: true, size: 12 };
  sHead.fill = sectionFill;
  sHead.border = thinBorder;
  row++;

  ws.getCell(row, 1).value = "День";
  ws.getCell(row, 2).value = "Средн. T, °C";
  ws.getCell(row, 3).value = "Средн. H, %";
  ws.getRow(row).font = { bold: true };
  stylePairRow(ws, row, 3);
  row++;
  const sensStart = row;
  for (const r of report.series.sensorsDaily) {
    ws.getCell(row, 1).value = r.day;
    ws.getCell(row, 2).value =
      typeof r.avgTemp === "number" ? Math.round(r.avgTemp * 10) / 10 : "";
    ws.getCell(row, 3).value =
      typeof r.avgHum === "number" ? Math.round(r.avgHum * 10) / 10 : "";
    stylePairRow(ws, row, 3);
    row++;
  }
  const sensEnd = row - 1;
  if (sensEnd >= sensStart) {
    ws.addConditionalFormatting({
      ref: `B${sensStart}:B${sensEnd}`,
      rules: [{ type: "dataBar", priority: 4, gradient: true, cfvo: [{ type: "min" }, { type: "max" }] }],
    });
    ws.addConditionalFormatting({
      ref: `C${sensStart}:C${sensEnd}`,
      rules: [{ type: "dataBar", priority: 5, gradient: true, cfvo: [{ type: "min" }, { type: "max" }] }],
    });
  }

  row++;
  ws.mergeCells(row, 1, row, 6);
  const chartNote = ws.getCell(row, 1);
  chartNote.value =
    "Графики ниже — встроенные PNG (quickchart.io). Нужен интернет при экспорте; если блок пустой, сервис недоступен.";
  chartNote.font = { italic: true, size: 10 };
  chartNote.alignment = { wrapText: true };
  row++;

  const imgExt = { width: 520, height: 270 } as const;
  const rowSpan = 17;

  if (report.table.length) {
    const harvestPng = await fetchQuickChartPng({
      type: "bar",
      data: {
        labels: shortChartLabels(report.table.map((x) => x.name)),
        datasets: [
          {
            label: "Урожай (партий)",
            data: report.table.map((x) => x.harvested),
            backgroundColor: "rgba(34,197,94,0.65)",
          },
        ],
      },
      options: {
        plugins: { legend: { display: true } },
        scales: { y: { beginAtZero: true } },
      },
    });
    if (harvestPng) {
      // exceljs тип buffer конфликтует с DOM/ESM Buffer в TS 5+
      const id = wb.addImage({ buffer: harvestPng as never, extension: "png" });
      ws.addImage(id, { tl: { col: 0, row: row - 1 }, ext: imgExt });
      row += rowSpan;
    }
  }

  const wd = report.series.waterDaily.slice(-28);
  if (wd.length) {
    const waterPng = await fetchQuickChartPng({
      type: "line",
      data: {
        labels: wd.map((d) => d.day.slice(5)),
        datasets: [
          {
            label: "Расход воды, л",
            data: wd.map((d) => d.liters),
            borderColor: "#2563eb",
            backgroundColor: "rgba(37,99,235,0.15)",
            fill: true,
            tension: 0.25,
          },
        ],
      },
      options: { scales: { y: { beginAtZero: true } } },
    });
    if (waterPng) {
      const id = wb.addImage({ buffer: waterPng as never, extension: "png" });
      ws.addImage(id, { tl: { col: 0, row: row - 1 }, ext: imgExt });
      row += rowSpan;
    }
  }

  const td = report.series.tasksDaily.slice(-21);
  if (td.length) {
    const tasksPng = await fetchQuickChartPng({
      type: "bar",
      data: {
        labels: td.map((d) => d.day.slice(5)),
        datasets: [
          {
            label: "Всего",
            data: td.map((d) => d.total),
            backgroundColor: "rgba(148,163,184,0.55)",
          },
          {
            label: "Выполнено",
            data: td.map((d) => d.done),
            backgroundColor: "rgba(34,197,94,0.65)",
          },
        ],
      },
      options: {
        scales: {
          y: { beginAtZero: true },
        },
      },
    });
    if (tasksPng) {
      const id = wb.addImage({ buffer: tasksPng as never, extension: "png" });
      ws.addImage(id, { tl: { col: 0, row: row - 1 }, ext: imgExt });
      row += rowSpan;
    }
  }

  const buf = (await wb.xlsx.writeBuffer()) as ArrayBuffer;
  return Buffer.from(buf);
}

function resolvePdfFont(): string | undefined {
  const candidates = [
    path.join(process.cwd(), "public", "fonts", "NotoSans-Regular.ttf"),
    path.join(process.cwd(), "public", "fonts", "DejaVuSans.ttf"),
    "C:\\Windows\\Fonts\\arial.ttf",
    "C:\\Windows\\Fonts\\arialuni.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    "/usr/share/fonts/truetype/noto/NotoSans-Regular.ttf",
  ];
  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) return p;
    } catch {
      /* ignore */
    }
  }
  return undefined;
}

function pdfMarginLeft(doc: InstanceType<typeof PDFDocument>) {
  return doc.page.margins.left;
}

function pdfMarginRight(doc: InstanceType<typeof PDFDocument>) {
  return doc.page.margins.right;
}

function pdfInnerWidth(doc: InstanceType<typeof PDFDocument>) {
  return doc.page.width - pdfMarginLeft(doc) - pdfMarginRight(doc);
}

function pdfSyncX(doc: InstanceType<typeof PDFDocument>) {
  doc.x = pdfMarginLeft(doc);
}

/** Новая страница при нехватке места; после разрыва курсор слева. */
function pdfEnsureHeight(doc: InstanceType<typeof PDFDocument>, needed: number) {
  const bottom = doc.page.height - doc.page.margins.bottom;
  if (doc.y + needed > bottom) {
    doc.addPage();
    pdfSyncX(doc);
  }
}

function pdfSectionTitle(doc: InstanceType<typeof PDFDocument>, title: string) {
  pdfSyncX(doc);
  pdfEnsureHeight(doc, 52);
  doc.moveDown(0.5);
  const yTitle = doc.y;
  doc.fontSize(13).fillColor("#0f172a").text(title, pdfMarginLeft(doc), yTitle, {
    width: pdfInnerWidth(doc),
  });
  const lineY = doc.y + 6;
  doc.strokeColor("#cbd5e1")
    .lineWidth(0.75)
    .moveTo(pdfMarginLeft(doc), lineY)
    .lineTo(pdfMarginLeft(doc) + pdfInnerWidth(doc), lineY)
    .stroke();
  doc.strokeColor("#000000").lineWidth(1);
  doc.y = lineY + 14;
  pdfSyncX(doc);
}

function formatPdfBarValue(v: number, mode: "integer" | "oneDecimal"): string {
  if (mode === "integer") return String(Math.round(v));
  const r = Math.round(v * 10) / 10;
  return Number.isInteger(r) ? String(r) : r.toFixed(1);
}

/** Столбиковая мини-диаграмма: шкала Y (min→max), числа над столбцами, подписи по X. */
function drawMiniBars(
  doc: InstanceType<typeof PDFDocument>,
  values: number[],
  color: string,
  options?: {
    maxBars?: number;
    height?: number;
    /** Подписи по оси X (те же длины, что и values; режется вместе со slice). */
    xLabels?: string[];
    valueFormat?: "integer" | "oneDecimal";
  },
) {
  const ml = pdfMarginLeft(doc);
  const iw = pdfInnerWidth(doc);
  const h = options?.height ?? 118;
  const maxBars = options?.maxBars ?? 20;
  const slice = values.slice(-maxBars);
  const labelSlice = options?.xLabels?.slice(-maxBars) ?? slice.map(() => "");
  const fmtMode = options?.valueFormat ?? "oneDecimal";

  if (slice.length === 0) {
    pdfEnsureHeight(doc, 28);
    pdfSyncX(doc);
    doc.fontSize(9).fillColor("#94a3b8").text("Нет данных для графика.", pdfMarginLeft(doc), doc.y, {
      width: pdfInnerWidth(doc),
    });
    doc.y += 22;
    pdfSyncX(doc);
    return;
  }

  let minV = Math.min(...slice);
  let maxV = Math.max(...slice);
  if (!Number.isFinite(minV)) minV = 0;
  if (!Number.isFinite(maxV)) maxV = 1;
  if (maxV === minV) maxV = minV + (minV === 0 ? 1 : Math.max(Math.abs(minV) * 0.05, 0.01));
  const span = maxV - minV;

  pdfEnsureHeight(doc, h + 28);
  pdfSyncX(doc);
  const top = doc.y;

  const gutterL = 40;
  const padR = 10;
  const padTop = 10;
  const padBottom = 20;
  const leftAxis = ml + gutterL;
  const rightX = ml + iw - padR;
  const plotW = Math.max(20, rightX - leftAxis);
  const topPlot = top + padTop;
  const baseY = top + h - padBottom;
  const innerH = Math.max(24, baseY - topPlot);

  doc.save();
  doc.rect(ml, top, iw, h).fill("#f8fafc");
  doc.rect(ml, top, iw, h).strokeColor("#e2e8f0").lineWidth(0.6).stroke();

  doc.fontSize(7).fillColor("#64748b");
  doc.text(formatPdfBarValue(maxV, fmtMode), ml + 6, topPlot - 2, { width: gutterL - 8, align: "right" });
  doc.text(formatPdfBarValue(minV, fmtMode), ml + 6, baseY - 9, { width: gutterL - 8, align: "right" });

  doc.strokeColor("#cbd5e1").lineWidth(0.5).moveTo(leftAxis, baseY).lineTo(rightX, baseY).stroke();

  const n = Math.max(1, slice.length);
  const barW = plotW / n;

  for (let i = 0; i < slice.length; i++) {
    const v = slice[i]!;
    const bh = Math.round(((v - minV) / span) * innerH);
    const x = leftAxis + i * barW + 1;
    const bw = Math.max(3, barW - 3);
    doc.rect(x, baseY - bh, bw, bh).fill(color);

    const txt = formatPdfBarValue(v, fmtMode);
    if (bw >= 8) {
      doc.fontSize(bw >= 14 ? 7 : 6).fillColor("#334155");
      const tw = Math.max(bw, 18);
      let ty = baseY - bh - (bw >= 14 ? 9 : 7);
      ty = Math.max(topPlot + 1, ty);
      doc.text(txt, x + (bw - tw) / 2, ty, { width: tw, align: "center", lineGap: 0 });
    }

    const lx = labelSlice[i]?.trim() ?? "";
    const short = lx.length >= 10 ? lx.slice(5, 10) : lx.length > 5 ? lx.slice(-5) : lx;
    if (short) {
      doc.fontSize(6).fillColor("#94a3b8").text(short, x - 1, baseY + 3, {
        width: bw + 2,
        align: "center",
      });
    }
  }

  doc.strokeColor("#000000").lineWidth(1);
  doc.restore();

  doc.y = top + h + 16;
  pdfSyncX(doc);
}

function drawHarvestBars(doc: InstanceType<typeof PDFDocument>, table: Array<{ harvested: number }>) {
  if (!table.length) return;
  const ml = pdfMarginLeft(doc);
  const iw = pdfInnerWidth(doc);
  const h = 112;
  const max = Math.max(1, ...table.map((r) => r.harvested));

  pdfEnsureHeight(doc, h + 28);
  pdfSyncX(doc);
  const top = doc.y;

  doc.save();
  doc.rect(ml, top, iw, h).fill("#f0fdf4");
  doc.rect(ml, top, iw, h).strokeColor("#bbf7d0").lineWidth(0.6).stroke();

  const pad = 12;
  const padBottom = 18;
  const innerW = iw - pad * 2;
  const plotH = h - pad - padBottom - 14;
  const barW = innerW / Math.max(1, table.length);
  const baseY = top + h - padBottom;

  doc.fontSize(7).fillColor("#64748b").text(String(max), ml + pad, top + 8, { width: 28, align: "left" });
  doc.strokeColor("#bbf7d0").lineWidth(0.5).moveTo(ml + pad, baseY).lineTo(ml + iw - pad, baseY).stroke();

  for (let i = 0; i < table.length; i++) {
    const v = table[i]!.harvested;
    const bh = Math.round((v / max) * plotH);
    const x = ml + pad + i * barW + 2;
    const bw = Math.max(4, barW - 5);
    doc.rect(x, baseY - bh, bw, bh).fill("#22c55e");
    doc.fontSize(8).fillColor("#14532d").text(String(v), x, baseY - bh - 10, { width: bw, align: "center" });
    doc.fontSize(6).fillColor("#64748b").text(`№${i + 1}`, x, baseY + 3, { width: bw, align: "center" });
  }

  doc.strokeColor("#000000").lineWidth(1);
  doc.restore();

  doc.y = top + h + 14;
  pdfSyncX(doc);
}

function drawGreenhouseTable(
  doc: InstanceType<typeof PDFDocument>,
  rows: Array<{ name: string; harvested: number }>,
) {
  const ml = pdfMarginLeft(doc);
  const iw = pdfInnerWidth(doc);
  const colRightW = 64;
  const gutter = 14;
  const colLeftW = iw - colRightW - gutter;

  doc.fontSize(10);
  const estH =
    28 +
    rows.reduce((acc, r) => acc + Math.max(20, doc.heightOfString(r.name, { width: colLeftW }) + 6), 0);
  pdfEnsureHeight(doc, estH + 16);
  pdfSyncX(doc);

  let y = doc.y;
  doc.save();
  doc.rect(ml, y, iw, 24).fill("#f1f5f9");
  doc.fontSize(10).fillColor("#475569");
  doc.text("Теплица", ml + 12, y + 7, { width: colLeftW });
  doc.text("Партии", ml + iw - colRightW - 12, y + 7, { width: colRightW - 4, align: "right" });
  doc.restore();
  y += 26;

  doc.strokeColor("#e2e8f0").lineWidth(0.5).moveTo(ml, y).lineTo(ml + iw, y).stroke();
  doc.strokeColor("#000000").lineWidth(1);
  y += 8;

  for (const r of rows) {
    const rowH = Math.max(22, doc.heightOfString(r.name, { width: colLeftW }) + 6);
    pdfEnsureHeight(doc, rowH + 8);
    doc.fontSize(10).fillColor("#1e293b");
    doc.text(r.name, ml + 12, y, { width: colLeftW });
    doc.fillColor("#059669").text(String(r.harvested), ml + iw - colRightW - 12, y, {
      width: colRightW - 4,
      align: "right",
    });
    y += rowH;
  }

  doc.y = y + 12;
  pdfSyncX(doc);
}

async function exportPdf(report: Awaited<ReturnType<typeof buildReport>>) {
  const doc = new PDFDocument({ size: "A4", margin: 52 });
  const chunks: Buffer[] = [];
  doc.on("data", (c) => chunks.push(c as Buffer));

  const fontPath = resolvePdfFont();
  if (fontPath) {
    doc.registerFont("FG", fontPath);
    doc.font("FG");
  }

  pdfSyncX(doc);
  doc.fontSize(20).fillColor("#0f172a").text("Future Greenhouse", pdfMarginLeft(doc), doc.y, {
    width: pdfInnerWidth(doc),
  });
  doc.moveDown(0.25);
  doc.fontSize(12).fillColor("#64748b").text("Аналитический отчёт", pdfMarginLeft(doc), doc.y, {
    width: pdfInnerWidth(doc),
  });
  doc.moveDown(0.35);
  doc.fontSize(11).fillColor("#334155").text(`Период: ${report.periodTitle}`, pdfMarginLeft(doc), doc.y, {
    width: pdfInnerWidth(doc),
  });
  doc.moveDown(1);

  pdfEnsureHeight(doc, 88);
  pdfSyncX(doc);
  const kpiTop = doc.y;
  const kpiH = 76;
  const ml = pdfMarginLeft(doc);
  const iw = pdfInnerWidth(doc);
  doc.save();
  doc.rect(ml, kpiTop, iw, kpiH).fill("#f8fafc");
  doc.rect(ml, kpiTop, iw, kpiH).strokeColor("#e2e8f0").lineWidth(0.75).stroke();
  doc.fontSize(11).fillColor("#0f172a");
  let ky = kpiTop + 14;
  doc.text(`Урожай (партий): ${report.kpi.harvested}`, ml + 18, ky, { width: iw - 36 });
  ky += 18;
  doc.fillColor("#334155").text(`Расход воды (л): ${report.kpi.waterLiters}`, ml + 18, ky, { width: iw - 36 });
  ky += 18;
  doc.text(
    `Задачи: ${report.kpi.tasksDone} / ${report.kpi.tasksTotal} выполнено (${report.kpi.tasksCompletionPct}%)`,
    ml + 18,
    ky,
    { width: iw - 36 },
  );
  doc.restore();
  doc.y = kpiTop + kpiH + 20;
  pdfSyncX(doc);

  pdfSectionTitle(doc, "Урожай по теплицам");
  drawHarvestBars(doc, report.table);
  drawGreenhouseTable(doc, report.table);

  pdfSectionTitle(doc, "Тренды по дням");

  if (report.series.waterDaily.length) {
    pdfEnsureHeight(doc, 130);
    pdfSyncX(doc);
    doc.fontSize(11).fillColor("#334155").text("Расход воды (л)", pdfMarginLeft(doc), doc.y, {
      width: pdfInnerWidth(doc),
    });
    doc.moveDown(0.45);
    drawMiniBars(doc, report.series.waterDaily.map((x) => x.liters), "#2563eb", {
      xLabels: report.series.waterDaily.map((x) => x.day),
      valueFormat: "oneDecimal",
    });
  }

  if (report.series.tasksDaily.length) {
    pdfEnsureHeight(doc, 130);
    pdfSyncX(doc);
    doc.fontSize(11).fillColor("#334155").text("Задачи: выполнено", pdfMarginLeft(doc), doc.y, {
      width: pdfInnerWidth(doc),
    });
    doc.moveDown(0.45);
    drawMiniBars(doc, report.series.tasksDaily.map((x) => x.done), "#16a34a", {
      xLabels: report.series.tasksDaily.map((x) => x.day),
      valueFormat: "integer",
    });
  }

  if (report.series.sensorsDaily.length) {
    const sliceRows = report.series.sensorsDaily.slice(-14);
    const temps = sliceRows.map((x) => (typeof x.avgTemp === "number" ? x.avgTemp : 0));
    const hums = sliceRows.map((x) => (typeof x.avgHum === "number" ? x.avgHum : 0));
    if (sliceRows.some((x) => x.avgTemp != null || x.avgHum != null)) {
      pdfEnsureHeight(doc, 130);
      pdfSyncX(doc);
      doc.fontSize(11).fillColor("#334155").text("Средняя температура (°C)", pdfMarginLeft(doc), doc.y, {
        width: pdfInnerWidth(doc),
      });
      doc.moveDown(0.45);
      drawMiniBars(doc, temps, "#15803d", {
        xLabels: sliceRows.map((x) => x.day),
        valueFormat: "oneDecimal",
      });

      pdfEnsureHeight(doc, 130);
      pdfSyncX(doc);
      doc.fontSize(11).fillColor("#334155").text("Средняя влажность (%)", pdfMarginLeft(doc), doc.y, {
        width: pdfInnerWidth(doc),
      });
      doc.moveDown(0.45);
      drawMiniBars(doc, hums, "#1d4ed8", {
        xLabels: sliceRows.map((x) => x.day),
        valueFormat: "oneDecimal",
      });
    }
  }

  doc.end();

  await new Promise<void>((resolve) => doc.on("end", () => resolve()));
  return Buffer.concat(chunks);
}

export async function GET(req: Request) {
  const auth = await requireApiRoles(["admin", "agronomist", "director"]);
  if (!auth.ok) return auth.response;

  const url = new URL(req.url);
  const parsed = QuerySchema.safeParse({
    period: url.searchParams.get("period") ?? undefined,
    format: url.searchParams.get("format") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Некорректные параметры" },
      { status: 400 },
    );
  }

  const period = parsed.data.period ?? "month";
  const format = parsed.data.format ?? "json";

  const report = await buildReport(period);
  const { iv } = intervalFor(period);
  report.series.waterDaily = await loadWaterDaily(iv);
  report.series.tasksDaily = await loadTasksDaily(iv);
  report.series.sensorsDaily = await loadSensorsDaily(iv);

  if (format === "excel") {
    const buffer = await exportExcel(report);
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "content-type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "content-disposition": `attachment; filename="future-greenhouse-report-${period}.xlsx"`,
      },
    });
  }

  if (format === "pdf") {
    const buffer = await exportPdf(report);
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "content-type": "application/pdf",
        "content-disposition": `attachment; filename="future-greenhouse-report-${period}.pdf"`,
      },
    });
  }

  return NextResponse.json({ ok: true, report });
}
