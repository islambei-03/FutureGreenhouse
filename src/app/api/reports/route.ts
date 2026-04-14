import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireApiRoles } from "@/lib/api/rbac";
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";

const QuerySchema = z.object({
  period: z.enum(["day", "week", "month", "year"]).optional(),
  format: z.enum(["json", "pdf", "excel"]).optional(),
});

type Period = NonNullable<z.infer<typeof QuerySchema>["period"]>;

function periodToSqlRange(period: Period) {
  if (period === "day") return { from: "datetime('now', '-1 day')", title: "День" };
  if (period === "week") return { from: "datetime('now', '-7 day')", title: "Неделя" };
  if (period === "month") return { from: "datetime('now', '-1 month')", title: "Месяц" };
  return { from: "datetime('now', '-1 year')", title: "Год" };
}

function asNumber(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

async function buildReport(period: Period) {
  const { from, title } = periodToSqlRange(period);

  const waterRow = db()
    .prepare(
      `
      SELECT COALESCE(SUM(volume_liters), 0) as liters
      FROM watering_schedule
      WHERE datetime(scheduled_at) >= ${from} AND datetime(scheduled_at) <= datetime('now')
    `,
    )
    .get() as { liters: number };

  const taskRow = db()
    .prepare(
      `
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN is_completed = 1 THEN 1 ELSE 0 END) as done
      FROM tasks
      WHERE datetime(created_at) >= ${from} AND datetime(created_at) <= datetime('now')
    `,
    )
    .get() as { total: number; done: number };

  // "Урожай" в демо считаем по harvest_date культур (как факт сбора партии).
  const harvestRow = db()
    .prepare(
      `
      SELECT COUNT(*) as harvested
      FROM cultures
      WHERE harvest_date IS NOT NULL
        AND date(harvest_date) >= date(${from})
        AND date(harvest_date) <= date('now')
    `,
    )
    .get() as { harvested: number };

  const byGreenhouse = db()
    .prepare(
      `
      SELECT
        g.id,
        g.name,
        COUNT(c.id) as harvested
      FROM greenhouses g
      LEFT JOIN cultures c
        ON c.greenhouse_id = g.id
        AND c.harvest_date IS NOT NULL
        AND date(c.harvest_date) >= date(${from})
        AND date(c.harvest_date) <= date('now')
      GROUP BY g.id
      ORDER BY g.id ASC
    `,
    )
    .all() as Array<{ id: number; name: string; harvested: number }>;

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
  };
}

async function exportExcel(report: Awaited<ReturnType<typeof buildReport>>) {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Future Greenhouse";
  wb.created = new Date();

  const ws = wb.addWorksheet("Отчёт");
  ws.columns = [
    { header: "Показатель", key: "k", width: 28 },
    { header: "Значение", key: "v", width: 22 },
  ];
  ws.addRow({ k: "Период", v: report.periodTitle });
  ws.addRow({ k: "Урожай (партий)", v: report.kpi.harvested });
  ws.addRow({ k: "Расход воды (л)", v: report.kpi.waterLiters });
  ws.addRow({ k: "Задачи (всего)", v: report.kpi.tasksTotal });
  ws.addRow({ k: "Задачи (выполнено)", v: report.kpi.tasksDone });
  ws.addRow({ k: "Выполнение задач (%)", v: report.kpi.tasksCompletionPct });
  ws.getRow(1).font = { bold: true };

  const ws2 = wb.addWorksheet("Урожай по теплицам");
  ws2.columns = [
    { header: "Теплица", key: "name", width: 38 },
    { header: "Урожай (партий)", key: "harvested", width: 18 },
  ];
  report.table.forEach((r) => ws2.addRow({ name: r.name, harvested: r.harvested }));
  ws2.getRow(1).font = { bold: true };

  const buf = (await wb.xlsx.writeBuffer()) as ArrayBuffer;
  return Buffer.from(buf);
}

async function exportPdf(report: Awaited<ReturnType<typeof buildReport>>) {
  const doc = new PDFDocument({ size: "A4", margin: 48 });
  const chunks: Buffer[] = [];
  doc.on("data", (c) => chunks.push(c as Buffer));

  doc.fontSize(18).text("Future Greenhouse — Отчёт", { align: "left" });
  doc.moveDown(0.5);
  doc.fontSize(11).fillColor("#444").text(`Период: ${report.periodTitle}`, { align: "left" });
  doc.moveDown(1);

  doc.fillColor("#000").fontSize(13).text("KPI", { underline: true });
  doc.moveDown(0.4);
  doc.fontSize(11).text(`Урожай (партий): ${report.kpi.harvested}`);
  doc.text(`Расход воды (л): ${report.kpi.waterLiters}`);
  doc.text(`Задачи: ${report.kpi.tasksDone}/${report.kpi.tasksTotal} (${report.kpi.tasksCompletionPct}%)`);
  doc.moveDown(1);

  doc.fontSize(13).text("Урожай по теплицам", { underline: true });
  doc.moveDown(0.5);

  const startX = doc.x;
  const col1 = 320;
  const col2 = 120;
  doc.fontSize(11).text("Теплица", startX, doc.y, { width: col1 });
  doc.text("Партии", startX + col1, doc.y, { width: col2 });
  doc.moveDown(0.4);
  doc.moveTo(startX, doc.y).lineTo(startX + col1 + col2, doc.y).strokeColor("#ddd").stroke();
  doc.moveDown(0.4);
  doc.strokeColor("#000");

  for (const r of report.table) {
    doc.text(r.name, startX, doc.y, { width: col1 });
    doc.text(String(r.harvested), startX + col1, doc.y, { width: col2 });
    doc.moveDown(0.25);
  }

  doc.end();

  await new Promise<void>((resolve) => doc.on("end", () => resolve()));
  return Buffer.concat(chunks);
}

export async function GET(req: Request) {
  const auth = await requireApiRoles(["admin", "agronomist", "viewer"]);
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

  if (format === "excel") {
    const buffer = await exportExcel(report);
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "content-type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "content-disposition": `attachment; filename="future-greenhouse-report-${period}.xlsx"`,
      },
    });
  }

  if (format === "pdf") {
    const buffer = await exportPdf(report);
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "content-type": "application/pdf",
        "content-disposition": `attachment; filename="future-greenhouse-report-${period}.pdf"`,
      },
    });
  }

  return NextResponse.json({ ok: true, report });
}

