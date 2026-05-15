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

type ReportAnalytics = {
  taskPriorities: Array<{ priority: string; count: number }>;
  wateringStatus: { done: number; pending: number };
  cultureStages: Array<{ stage: string; count: number }>;
  greenhouseAvgTemp: Array<{ name: string; avg_temp: number }>;
  co2Daily: Array<{ day: string; avgCo2: number }>;
  notificationsByType: Array<{ type: string; count: number }>;
};

type FullReport = Awaited<ReturnType<typeof buildReport>> & { analytics: ReportAnalytics };

async function loadReportAnalytics(iv: string): Promise<ReportAnalytics> {
  const [taskPriorities, wateringRow, cultureStages, greenhouseAvgTemp, co2Daily, notificationsByType] =
    await Promise.all([
      (await db()
        .prepare(
          `
      SELECT priority, COUNT(*)::int as count
      FROM tasks
      WHERE created_at >= (NOW() AT TIME ZONE 'UTC' - ?::interval)
        AND created_at <= (NOW() AT TIME ZONE 'UTC')
      GROUP BY priority
      ORDER BY CASE priority WHEN 'срочный' THEN 1 WHEN 'высокий' THEN 2 ELSE 3 END
    `,
        )
        .all(iv)) as Array<{ priority: string; count: number }>,
      (await db()
        .prepare(
          `
      SELECT
        COALESCE(SUM(CASE WHEN is_done = 1 THEN 1 ELSE 0 END), 0)::int as done,
        COALESCE(SUM(CASE WHEN is_done = 0 THEN 1 ELSE 0 END), 0)::int as pending
      FROM watering_schedule
      WHERE scheduled_at >= (NOW() AT TIME ZONE 'UTC' - ?::interval)
        AND scheduled_at <= (NOW() AT TIME ZONE 'UTC')
    `,
        )
        .get(iv)) as { done: number; pending: number } | undefined,
      (await db()
        .prepare(
          `
      SELECT stage, COUNT(*)::int as count
      FROM cultures
      GROUP BY stage
      ORDER BY count DESC
    `,
        )
        .all()) as Array<{ stage: string; count: number }>,
      (await db()
        .prepare(
          `
      SELECT g.name, AVG(s.temperature)::float8 as avg_temp
      FROM sensor_data s
      JOIN greenhouses g ON g.id = s.greenhouse_id
      WHERE s.recorded_at >= (NOW() AT TIME ZONE 'UTC' - ?::interval)
        AND s.recorded_at <= (NOW() AT TIME ZONE 'UTC')
      GROUP BY g.id, g.name
      ORDER BY g.name ASC
    `,
        )
        .all(iv)) as Array<{ name: string; avg_temp: number }>,
      (await db()
        .prepare(
          `
      SELECT
        to_char(date_trunc('day', recorded_at AT TIME ZONE 'UTC'), 'YYYY-MM-DD') as day,
        AVG(co2)::float8 as "avgCo2"
      FROM sensor_data
      WHERE recorded_at >= (NOW() AT TIME ZONE 'UTC' - ?::interval)
        AND recorded_at <= (NOW() AT TIME ZONE 'UTC')
      GROUP BY 1
      ORDER BY 1 ASC
    `,
        )
        .all(iv)) as Array<{ day: string; avgCo2: number }>,
      (await db()
        .prepare(
          `
      SELECT type, COUNT(*)::int as count
      FROM notifications
      WHERE created_at >= (NOW() AT TIME ZONE 'UTC' - ?::interval)
        AND created_at <= (NOW() AT TIME ZONE 'UTC')
      GROUP BY type
      ORDER BY count DESC
    `,
        )
        .all(iv)) as Array<{ type: string; count: number }>,
    ]);

  return {
    taskPriorities,
    wateringStatus: wateringRow ?? { done: 0, pending: 0 },
    cultureStages,
    greenhouseAvgTemp,
    co2Daily,
    notificationsByType,
  };
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

/** PNG для вставки в Excel/PDF (Chart.js через QuickChart). Без сети вернёт null. */
async function fetchQuickChartPng(
  chart: Record<string, unknown>,
  size: { w: number; h: number } = { w: 540, h: 280 },
): Promise<Buffer | null> {
  try {
    const u = new URL("https://quickchart.io/chart");
    u.searchParams.set("c", JSON.stringify(chart));
    u.searchParams.set("w", String(size.w));
    u.searchParams.set("h", String(size.h));
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

function priorityRu(p: string) {
  if (p === "срочный") return "Срочный";
  if (p === "высокий") return "Высокий";
  return "Обычный";
}

function notifTypeRu(t: string) {
  const m: Record<string, string> = {
    тревога: "Тревога",
    предупреждение: "Предупреждение",
    информация: "Информация",
    успех: "Успех",
  };
  return m[t] ?? t;
}

function excelSectionHeader(ws: ExcelJS.Worksheet, row: number, title: string): number {
  ws.mergeCells(row, 1, row, 6);
  const c = ws.getCell(row, 1);
  c.value = title;
  c.font = { bold: true, size: 12 };
  c.fill = sectionFill;
  c.border = thinBorder;
  return row + 1;
}

async function exportExcel(report: FullReport) {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Future Greenhouse";
  wb.created = new Date();
  const colWidths = [28, 18, 14, 14, 14, 14];

  const applyCols = (ws: ExcelJS.Worksheet) => {
    colWidths.forEach((w, i) => {
      ws.getColumn(i + 1).width = w;
    });
  };

  // ——— Лист «Сводка» ———
  const sum = wb.addWorksheet("Сводка", {
    views: [{ state: "frozen", ySplit: 2, activeCell: "A3", showGridLines: true }],
  });
  applyCols(sum);
  let row = 1;
  sum.mergeCells(row, 1, row, 6);
  const title = sum.getCell(row, 1);
  title.value = "Future Greenhouse — отчёт";
  title.font = { bold: true, size: 14 };
  title.alignment = { horizontal: "center", vertical: "middle" };
  row++;
  sum.getCell(row, 1).value = "Период";
  sum.getCell(row, 2).value = report.periodTitle;
  sum.getCell(row, 1).font = { bold: true };
  row += 2;

  row = excelSectionHeader(sum, row, "KPI");
  const kpiLines: Array<[string, string | number]> = [
    ["Урожай (партий)", report.kpi.harvested],
    ["Расход воды (л)", Math.round(report.kpi.waterLiters * 100) / 100],
    ["Задачи (всего)", report.kpi.tasksTotal],
    ["Задачи (выполнено)", report.kpi.tasksDone],
    ["Выполнение задач (%)", report.kpi.tasksCompletionPct],
  ];
  for (const [k, v] of kpiLines) {
    sum.getCell(row, 1).value = k;
    sum.getCell(row, 2).value = v;
    stylePairRow(sum, row, 2);
    row++;
  }
  row++;
  sum.mergeCells(row, 1, row, 6);
  sum.getCell(row, 1).value =
    "Полные таблицы — лист «Таблицы». Диаграммы (PNG) — лист «Графики» (нужен интернет quickchart.io при экспорте).";
  sum.getCell(row, 1).font = { italic: true, size: 10 };
  sum.getCell(row, 1).alignment = { wrapText: true };

  // ——— Лист «Таблицы» ———
  const ws = wb.addWorksheet("Таблицы", {
    views: [{ state: "frozen", ySplit: 1, activeCell: "A2", showGridLines: true }],
  });
  applyCols(ws);
  row = 1;
  row = excelSectionHeader(ws, row, "Урожай по теплицам");
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

  row = excelSectionHeader(ws, row, "Тренд: расход воды по дням");
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

  row = excelSectionHeader(ws, row, "Тренд: задачи по дням");
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

  row = excelSectionHeader(ws, row, "Тренд: датчики (средние по дням)");
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

  row = excelSectionHeader(ws, row, "CO₂ по дням (среднее)");
  ws.getCell(row, 1).value = "День";
  ws.getCell(row, 2).value = "CO₂, ppm";
  ws.getRow(row).font = { bold: true };
  stylePairRow(ws, row, 2);
  row++;
  for (const r of report.analytics.co2Daily) {
    ws.getCell(row, 1).value = r.day;
    ws.getCell(row, 2).value = Math.round(r.avgCo2 * 10) / 10;
    stylePairRow(ws, row, 2);
    row++;
  }
  row++;

  row = excelSectionHeader(ws, row, "Задачи: приоритеты (за период)");
  ws.getCell(row, 1).value = "Приоритет";
  ws.getCell(row, 2).value = "Кол-во";
  ws.getRow(row).font = { bold: true };
  stylePairRow(ws, row, 2);
  row++;
  for (const r of report.analytics.taskPriorities) {
    ws.getCell(row, 1).value = priorityRu(r.priority);
    ws.getCell(row, 2).value = r.count;
    stylePairRow(ws, row, 2);
    row++;
  }
  row++;

  row = excelSectionHeader(ws, row, "Полив за период (события)");
  ws.getCell(row, 1).value = "Выполнено";
  ws.getCell(row, 2).value = report.analytics.wateringStatus.done;
  stylePairRow(ws, row, 2);
  row++;
  ws.getCell(row, 1).value = "Запланировано (не выполнено)";
  ws.getCell(row, 2).value = report.analytics.wateringStatus.pending;
  stylePairRow(ws, row, 2);
  row += 2;

  row = excelSectionHeader(ws, row, "Культуры по стадиям (все теплицы)");
  ws.getCell(row, 1).value = "Стадия";
  ws.getCell(row, 2).value = "Кол-во";
  ws.getRow(row).font = { bold: true };
  stylePairRow(ws, row, 2);
  row++;
  for (const r of report.analytics.cultureStages) {
    ws.getCell(row, 1).value = r.stage;
    ws.getCell(row, 2).value = r.count;
    stylePairRow(ws, row, 2);
    row++;
  }
  row++;

  row = excelSectionHeader(ws, row, "Средняя температура по теплицам (за период)");
  ws.getCell(row, 1).value = "Теплица";
  ws.getCell(row, 2).value = "T, °C";
  ws.getRow(row).font = { bold: true };
  stylePairRow(ws, row, 2);
  row++;
  for (const r of report.analytics.greenhouseAvgTemp) {
    ws.getCell(row, 1).value = r.name;
    ws.getCell(row, 2).value = Math.round(r.avg_temp * 10) / 10;
    stylePairRow(ws, row, 2);
    row++;
  }
  row++;

  row = excelSectionHeader(ws, row, "Уведомления по типам (за период)");
  ws.getCell(row, 1).value = "Тип";
  ws.getCell(row, 2).value = "Кол-во";
  ws.getRow(row).font = { bold: true };
  stylePairRow(ws, row, 2);
  row++;
  for (const r of report.analytics.notificationsByType) {
    ws.getCell(row, 1).value = notifTypeRu(r.type);
    ws.getCell(row, 2).value = r.count;
    stylePairRow(ws, row, 2);
    row++;
  }

  // ——— Лист «Графики» ———
  const ch = wb.addWorksheet("Графики", {
    views: [{ state: "frozen", ySplit: 1, showGridLines: false }],
  });
  applyCols(ch);
  let cr = 1;
  ch.mergeCells(cr, 1, cr, 6);
  ch.getCell(cr, 1).value =
    "Диаграммы (PNG через quickchart.io). При отсутствии сети часть блоков может быть пустой.";
  ch.getCell(cr, 1).font = { italic: true, size: 10 };
  ch.getCell(cr, 1).alignment = { wrapText: true };
  cr += 2;

  const imgExt = { width: 520, height: 270 } as const;
  const rowSpan = 17;
  const a = report.analytics;

  async function placePng(chart: Record<string, unknown>) {
    const png = await fetchQuickChartPng(chart);
    if (!png) {
      ch.mergeCells(cr, 1, cr, 6);
      ch.getCell(cr, 1).value = "— график недоступен (сеть или нет данных) —";
      cr += 2;
      return;
    }
    const id = wb.addImage({ buffer: png as never, extension: "png" });
    ch.addImage(id, { tl: { col: 0, row: cr - 1 }, ext: imgExt });
    cr += rowSpan;
  }

  if (report.table.length) {
    await placePng({
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
        plugins: {
          title: { display: true, text: "Урожай по теплицам", font: { size: 14 } },
          legend: { display: true },
        },
        scales: { y: { beginAtZero: true } },
      },
    });
  }

  const wd = report.series.waterDaily.slice(-28);
  if (wd.length) {
    await placePng({
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
      options: {
        plugins: { title: { display: true, text: "Вода по дням", font: { size: 14 } } },
        scales: { y: { beginAtZero: true } },
      },
    });
  }

  const td = report.series.tasksDaily.slice(-21);
  if (td.length) {
    await placePng({
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
        plugins: { title: { display: true, text: "Задачи по дням", font: { size: 14 } } },
        scales: { y: { beginAtZero: true } },
      },
    });
  }

  const sd = report.series.sensorsDaily.slice(-21);
  if (sd.length) {
    await placePng({
      type: "line",
      data: {
        labels: sd.map((d) => d.day.slice(5)),
        datasets: [
          {
            label: "Темп., °C",
            data: sd.map((d) => (typeof d.avgTemp === "number" ? Number(d.avgTemp.toFixed(1)) : null)),
            borderColor: "#15803d",
            tension: 0.25,
          },
          {
            label: "Влажность, %",
            data: sd.map((d) => (typeof d.avgHum === "number" ? Number(d.avgHum.toFixed(1)) : null)),
            borderColor: "#1d4ed8",
            tension: 0.25,
          },
        ],
      },
      options: { plugins: { title: { display: true, text: "Климат по дням", font: { size: 14 } } } },
    });
  }

  const done = report.kpi.tasksDone;
  const pend = Math.max(0, report.kpi.tasksTotal - report.kpi.tasksDone);
  await placePng({
    type: "doughnut",
    data: {
      labels: ["Выполнено", "Не выполнено"],
      datasets: [{ data: [done, pend], backgroundColor: ["#22c55e", "#334155"] }],
    },
    options: { plugins: { title: { display: true, text: "Задачи: доля выполнения", font: { size: 14 } } } },
  });

  await placePng({
    type: "doughnut",
    data: {
      labels: ["Полив выполнен", "Ожидает"],
      datasets: [
        {
          data: [a.wateringStatus.done, a.wateringStatus.pending],
          backgroundColor: ["#22c55e", "#f59e0b"],
        },
      ],
    },
    options: { plugins: { title: { display: true, text: "Полив: статус за период", font: { size: 14 } } } },
  });

  if (a.taskPriorities.length) {
    await placePng({
      type: "bar",
      data: {
        labels: a.taskPriorities.map((x) => priorityRu(x.priority)),
        datasets: [{ label: "Задач", data: a.taskPriorities.map((x) => x.count), backgroundColor: "#6366f1" }],
      },
      options: {
        indexAxis: "y",
        plugins: { title: { display: true, text: "Задачи по приоритетам", font: { size: 14 } } },
        scales: { x: { beginAtZero: true } },
      },
    });
  }

  if (a.cultureStages.length) {
    await placePng({
      type: "pie",
      data: {
        labels: a.cultureStages.map((x) => x.stage),
        datasets: [{ data: a.cultureStages.map((x) => x.count), backgroundColor: ["#22c55e", "#3b82f6", "#eab308", "#a855f7", "#f97316"] }],
      },
      options: { plugins: { title: { display: true, text: "Культуры по стадиям", font: { size: 14 } } } },
    });
  }

  if (a.greenhouseAvgTemp.length) {
    await placePng({
      type: "bar",
      data: {
        labels: shortChartLabels(a.greenhouseAvgTemp.map((x) => x.name)),
        datasets: [
          {
            label: "Средняя T, °C",
            data: a.greenhouseAvgTemp.map((x) => Number(x.avg_temp.toFixed(1))),
            backgroundColor: "rgba(21,128,61,0.75)",
          },
        ],
      },
      options: {
        plugins: { title: { display: true, text: "Средняя температура по теплицам", font: { size: 14 } } },
        scales: { y: { beginAtZero: false } },
      },
    });
  }

  const cd = a.co2Daily.slice(-28);
  if (cd.length) {
    await placePng({
      type: "line",
      data: {
        labels: cd.map((d) => d.day.slice(5)),
        datasets: [
          {
            label: "CO₂, ppm",
            data: cd.map((d) => Math.round(d.avgCo2)),
            borderColor: "#a855f7",
            backgroundColor: "rgba(168,85,247,0.12)",
            fill: true,
            tension: 0.25,
          },
        ],
      },
      options: {
        plugins: { title: { display: true, text: "CO₂ по дням", font: { size: 14 } } },
        scales: { y: { beginAtZero: true } },
      },
    });
  }

  if (a.notificationsByType.length) {
    await placePng({
      type: "bar",
      data: {
        labels: a.notificationsByType.map((x) => notifTypeRu(x.type)),
        datasets: [{ label: "Сообщений", data: a.notificationsByType.map((x) => x.count), backgroundColor: "#0ea5e9" }],
      },
      options: {
        plugins: { title: { display: true, text: "Уведомления по типам", font: { size: 14 } } },
        scales: { y: { beginAtZero: true } },
      },
    });
  }

  const buf = (await wb.xlsx.writeBuffer()) as ArrayBuffer;
  return Buffer.from(buf);
}

/** Helvetica в PDFKit без кириллицы — на Vercel нужен свой TTF в `public/fonts` (в репозитории лежит DejaVuSans). */
function resolvePdfFont(): string | undefined {
  const candidates = [
    path.join(process.cwd(), "public", "fonts", "DejaVuSans.ttf"),
    path.join(process.cwd(), "public", "fonts", "NotoSans-Regular.ttf"),
    "C:\\Windows\\Fonts\\arialuni.ttf",
    "C:\\Windows\\Fonts\\arial.ttf",
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

const PDF_QC_SIZE = { w: 720, h: 380 } as const;

async function pdfQuickChart(
  doc: InstanceType<typeof PDFDocument>,
  sectionTitle: string,
  chart: Record<string, unknown>,
) {
  pdfSectionTitle(doc, sectionTitle);
  const png = await fetchQuickChartPng(chart, PDF_QC_SIZE);
  const ml = pdfMarginLeft(doc);
  const iw = pdfInnerWidth(doc);
  const imgH = Math.round(Math.min(PDF_QC_SIZE.h * (iw / PDF_QC_SIZE.w), iw * 0.52));
  if (!png) {
    pdfSyncX(doc);
    doc
      .fontSize(10)
      .fillColor("#64748b")
      .text("Диаграмма недоступна (интернет quickchart.io или нет данных для построения).", ml, doc.y, {
        width: iw,
      });
    doc.moveDown(2);
    pdfSyncX(doc);
    return;
  }
  pdfEnsureHeight(doc, imgH + 30);
  doc.image(png, ml, doc.y, { width: iw, height: imgH });
  doc.y += imgH + 22;
  pdfSyncX(doc);
}

async function exportPdf(report: FullReport) {
  const doc = new PDFDocument({ size: "A4", margin: 52 });
  const chunks: Buffer[] = [];
  doc.on("data", (c) => chunks.push(c as Buffer));

  const fontPath = resolvePdfFont();
  if (fontPath) {
    doc.registerFont("FG", fontPath);
    doc.font("FG");
  }

  const ml0 = pdfMarginLeft(doc);
  const iw0 = pdfInnerWidth(doc);

  pdfSyncX(doc);
  doc.fontSize(20).fillColor("#0f172a").text("Future Greenhouse", ml0, doc.y, { width: iw0 });
  doc.moveDown(0.25);
  doc.fontSize(12).fillColor("#64748b").text("Аналитический отчёт", ml0, doc.y, { width: iw0 });
  doc.moveDown(0.35);
  doc.fontSize(11).fillColor("#334155").text(`Период: ${report.periodTitle}`, ml0, doc.y, { width: iw0 });
  doc.moveDown(1);

  pdfSectionTitle(doc, "Содержание (разделы как вкладки)");
  doc.fontSize(10).fillColor("#334155");
  const toc = [
    "1. Сводные показатели (KPI)",
    "2. Урожай по теплицам — таблица и диаграмма",
    "3. Операционные тренды — вода, задачи, климат",
    "4. Расширенная аналитика — задачи, полив, культуры, климат, CO₂, уведомления",
  ];
  for (const line of toc) {
    pdfSyncX(doc);
    doc.text(`• ${line}`, ml0, doc.y, { width: iw0 });
    doc.moveDown(0.35);
  }
  doc.fontSize(9).fillColor("#64748b").text("Диаграммы строятся через quickchart.io (кириллица в подписях). Нужен доступ в интернет при генерации PDF.", ml0, doc.y, {
    width: iw0,
  });
  doc.moveDown(1.2);

  doc.addPage();
  pdfSectionTitle(doc, "Вкладка 1 — Сводные показатели (KPI)");
  pdfEnsureHeight(doc, 88);
  pdfSyncX(doc);
  const kpiTop = doc.y;
  const kpiH = 88;
  const ml = pdfMarginLeft(doc);
  const iw = pdfInnerWidth(doc);
  doc.save();
  doc.rect(ml, kpiTop, iw, kpiH).fill("#f8fafc");
  doc.rect(ml, kpiTop, iw, kpiH).strokeColor("#e2e8f0").lineWidth(0.75).stroke();
  doc.fontSize(11).fillColor("#0f172a");
  let ky = kpiTop + 14;
  doc.text(`Урожай (партий): ${report.kpi.harvested}`, ml + 18, ky, { width: iw - 36 });
  ky += 18;
  doc.fillColor("#334155").text(`Расход воды (л): ${Math.round(report.kpi.waterLiters * 100) / 100}`, ml + 18, ky, {
    width: iw - 36,
  });
  ky += 18;
  doc.text(
    `Задачи: ${report.kpi.tasksDone} / ${report.kpi.tasksTotal} выполнено (${report.kpi.tasksCompletionPct}%)`,
    ml + 18,
    ky,
    { width: iw - 36 },
  );
  ky += 18;
  doc.text(
    `Полив за период: выполнено ${report.analytics.wateringStatus.done}, ожидает ${report.analytics.wateringStatus.pending}`,
    ml + 18,
    ky,
    { width: iw - 36 },
  );
  doc.restore();
  doc.y = kpiTop + kpiH + 20;
  pdfSyncX(doc);

  doc.addPage();
  pdfSectionTitle(doc, "Вкладка 2 — Урожай по теплицам");
  drawGreenhouseTable(doc, report.table);
  if (report.table.length) {
    await pdfQuickChart(doc, "Диаграмма: урожай по теплицам", {
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
        plugins: {
          title: { display: true, text: "Урожай по теплицам", font: { size: 16 } },
          legend: { display: true },
        },
        scales: { y: { beginAtZero: true } },
      },
    });
  }

  doc.addPage();
  pdfSectionTitle(doc, "Вкладка 3 — Операционные тренды по дням");
  const wd = report.series.waterDaily.slice(-28);
  if (wd.length) {
    await pdfQuickChart(doc, "Расход воды (л)", {
      type: "line",
      data: {
        labels: wd.map((d) => d.day.slice(5)),
        datasets: [
          {
            label: "Литры",
            data: wd.map((d) => d.liters),
            borderColor: "#2563eb",
            backgroundColor: "rgba(37,99,235,0.15)",
            fill: true,
            tension: 0.25,
          },
        ],
      },
      options: {
        plugins: { title: { display: true, text: "Вода по дням", font: { size: 15 } } },
        scales: { y: { beginAtZero: true } },
      },
    });
  }
  const td = report.series.tasksDaily.slice(-21);
  if (td.length) {
    await pdfQuickChart(doc, "Задачи по дням", {
      type: "bar",
      data: {
        labels: td.map((d) => d.day.slice(5)),
        datasets: [
          { label: "Всего", data: td.map((d) => d.total), backgroundColor: "rgba(148,163,184,0.55)" },
          { label: "Выполнено", data: td.map((d) => d.done), backgroundColor: "rgba(34,197,94,0.65)" },
        ],
      },
      options: {
        plugins: { title: { display: true, text: "Задачи: всего и выполнено", font: { size: 15 } } },
        scales: { y: { beginAtZero: true } },
      },
    });
  }
  const sd = report.series.sensorsDaily.slice(-21);
  if (sd.length) {
    await pdfQuickChart(doc, "Климат по дням", {
      type: "line",
      data: {
        labels: sd.map((d) => d.day.slice(5)),
        datasets: [
          {
            label: "Температура, °C",
            data: sd.map((d) => (typeof d.avgTemp === "number" ? Number(d.avgTemp.toFixed(1)) : null)),
            borderColor: "#15803d",
            tension: 0.25,
          },
          {
            label: "Влажность, %",
            data: sd.map((d) => (typeof d.avgHum === "number" ? Number(d.avgHum.toFixed(1)) : null)),
            borderColor: "#1d4ed8",
            tension: 0.25,
          },
        ],
      },
      options: { plugins: { title: { display: true, text: "Среднесуточные показатели", font: { size: 15 } } } },
    });
  }

  doc.addPage();
  pdfSectionTitle(doc, "Вкладка 4 — Расширенная аналитика");
  const a = report.analytics;
  const done = report.kpi.tasksDone;
  const pend = Math.max(0, report.kpi.tasksTotal - report.kpi.tasksDone);

  await pdfQuickChart(doc, "Задачи: доля выполнения", {
    type: "doughnut",
    data: {
      labels: ["Выполнено", "Не выполнено"],
      datasets: [{ data: [done, pend], backgroundColor: ["#22c55e", "#334155"] }],
    },
    options: { plugins: { title: { display: true, text: "Статус задач за период", font: { size: 15 } } } },
  });

  await pdfQuickChart(doc, "Полив: выполнено и ожидает", {
    type: "doughnut",
    data: {
      labels: ["Выполнено", "Ожидает"],
      datasets: [{ data: [a.wateringStatus.done, a.wateringStatus.pending], backgroundColor: ["#22c55e", "#f59e0b"] }],
    },
    options: { plugins: { title: { display: true, text: "Полив за период", font: { size: 15 } } } },
  });

  if (a.taskPriorities.length) {
    await pdfQuickChart(doc, "Приоритеты задач", {
      type: "bar",
      data: {
        labels: a.taskPriorities.map((x) => priorityRu(x.priority)),
        datasets: [{ label: "Количество", data: a.taskPriorities.map((x) => x.count), backgroundColor: "#6366f1" }],
      },
      options: {
        indexAxis: "y",
        plugins: { title: { display: true, text: "Распределение по приоритету", font: { size: 15 } } },
        scales: { x: { beginAtZero: true } },
      },
    });
  }

  if (a.cultureStages.length) {
    await pdfQuickChart(doc, "Культуры по стадиям", {
      type: "pie",
      data: {
        labels: a.cultureStages.map((x) => x.stage),
        datasets: [
          {
            data: a.cultureStages.map((x) => x.count),
            backgroundColor: ["#22c55e", "#3b82f6", "#eab308", "#a855f7", "#f97316"],
          },
        ],
      },
      options: { plugins: { title: { display: true, text: "Портфель культур", font: { size: 15 } } } },
    });
  }

  if (a.greenhouseAvgTemp.length) {
    await pdfQuickChart(doc, "Средняя температура по теплицам", {
      type: "bar",
      data: {
        labels: shortChartLabels(a.greenhouseAvgTemp.map((x) => x.name)),
        datasets: [
          {
            label: "°C",
            data: a.greenhouseAvgTemp.map((x) => Number(x.avg_temp.toFixed(1))),
            backgroundColor: "rgba(21,128,61,0.75)",
          },
        ],
      },
      options: {
        plugins: { title: { display: true, text: "За выбранный период", font: { size: 15 } } },
        scales: { y: { beginAtZero: false } },
      },
    });
  }

  const cd = a.co2Daily.slice(-28);
  if (cd.length) {
    await pdfQuickChart(doc, "CO₂ по дням", {
      type: "line",
      data: {
        labels: cd.map((d) => d.day.slice(5)),
        datasets: [
          {
            label: "ppm",
            data: cd.map((d) => Math.round(d.avgCo2)),
            borderColor: "#a855f7",
            backgroundColor: "rgba(168,85,247,0.12)",
            fill: true,
            tension: 0.25,
          },
        ],
      },
      options: {
        plugins: { title: { display: true, text: "Среднесуточный CO₂", font: { size: 15 } } },
        scales: { y: { beginAtZero: true } },
      },
    });
  }

  if (a.notificationsByType.length) {
    await pdfQuickChart(doc, "Уведомления по типам", {
      type: "bar",
      data: {
        labels: a.notificationsByType.map((x) => notifTypeRu(x.type)),
        datasets: [{ label: "Кол-во", data: a.notificationsByType.map((x) => x.count), backgroundColor: "#0ea5e9" }],
      },
      options: {
        plugins: { title: { display: true, text: "За период отчёта", font: { size: 15 } } },
        scales: { y: { beginAtZero: true } },
      },
    });
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
  const [waterDaily, tasksDaily, sensorsDaily, analytics] = await Promise.all([
    loadWaterDaily(iv),
    loadTasksDaily(iv),
    loadSensorsDaily(iv),
    loadReportAnalytics(iv),
  ]);
  report.series.waterDaily = waterDaily;
  report.series.tasksDaily = tasksDaily;
  report.series.sensorsDaily = sensorsDaily;
  const fullReport: FullReport = { ...report, analytics };

  if (format === "excel") {
    const buffer = await exportExcel(fullReport);
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "content-type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "content-disposition": `attachment; filename="future-greenhouse-report-${period}.xlsx"`,
      },
    });
  }

  if (format === "pdf") {
    const buffer = await exportPdf(fullReport);
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "content-type": "application/pdf",
        "content-disposition": `attachment; filename="future-greenhouse-report-${period}.pdf"`,
      },
    });
  }

  return NextResponse.json({ ok: true, report: fullReport });
}
