"use client";

import { useMemo } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import type { ChartOptions, Plugin } from "chart.js";
import { Line } from "react-chartjs-2";
import type { GreenhouseForecast } from "@/lib/ai/forecast";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

function riskZonePlugin(
  tempMin: number,
  tempMax: number,
): Plugin<"line"> {
  return {
    id: "riskZones",
    beforeDraw(chart) {
      const { ctx, chartArea, scales } = chart;
      const y = scales.y;
      if (!y || !chartArea) return;
      const span = Math.max(2, tempMax - tempMin);
      const warn = span * 0.12;

      const bands: Array<{ y0: number; y1: number; color: string }> = [
        { y0: y.getPixelForValue(tempMin - warn * 3), y1: y.getPixelForValue(tempMin - warn), color: "rgba(239,68,68,0.12)" },
        { y0: y.getPixelForValue(tempMin - warn), y1: y.getPixelForValue(tempMin), color: "rgba(234,179,8,0.14)" },
        { y0: y.getPixelForValue(tempMin), y1: y.getPixelForValue(tempMax), color: "rgba(34,197,94,0.16)" },
        { y0: y.getPixelForValue(tempMax), y1: y.getPixelForValue(tempMax + warn), color: "rgba(234,179,8,0.14)" },
        { y0: y.getPixelForValue(tempMax + warn), y1: y.getPixelForValue(tempMax + warn * 3), color: "rgba(239,68,68,0.12)" },
      ];

      ctx.save();
      for (const b of bands) {
        const top = Math.min(b.y0, b.y1);
        const h = Math.abs(b.y1 - b.y0);
        ctx.fillStyle = b.color;
        ctx.fillRect(chartArea.left, top, chartArea.right - chartArea.left, h);
      }
      ctx.restore();
    },
  };
}

export default function ForecastChart({ forecast }: { forecast: GreenhouseForecast }) {
  const g = forecast.greenhouse;
  const labels = forecast.points.map((p) => p.day.slice(5));

  const histCount = forecast.points.filter((p) => p.kind === "history").length;

  const data = useMemo(
    () => ({
      labels,
      datasets: [
        {
          label: "Температура (факт)",
          data: forecast.points.map((p) => (p.kind === "history" ? p.temperature : null)),
          borderColor: "rgba(34,197,94,0.95)",
          backgroundColor: "rgba(34,197,94,0.1)",
          tension: 0.3,
          pointRadius: 3,
          spanGaps: false,
        },
        {
          label: "Температура (прогноз)",
          data: forecast.points.map((p, i) => {
            if (p.kind !== "forecast") return null;
            const prev = forecast.points[i - 1];
            if (prev?.kind === "history") return prev.temperature;
            return p.temperature;
          }),
          borderColor: "rgba(59,130,246,0.95)",
          borderDash: [6, 4],
          backgroundColor: "transparent",
          tension: 0.3,
          pointRadius: 4,
          pointBackgroundColor: forecast.points.map((p) =>
            p.tempRisk === "danger" ? "#ef4444" : p.tempRisk === "warn" ? "#eab308" : "#22c55e",
          ),
        },
        {
          label: "Влажность (факт)",
          data: forecast.points.map((p) => (p.kind === "history" ? p.humidity : null)),
          borderColor: "rgba(14,165,233,0.7)",
          backgroundColor: "transparent",
          tension: 0.3,
          pointRadius: 2,
          yAxisID: "y1",
        },
        {
          label: "Влажность (прогноз)",
          data: forecast.points.map((p, i) => {
            if (p.kind !== "forecast") return null;
            const prev = forecast.points[i - 1];
            if (prev?.kind === "history") return prev.humidity;
            return p.humidity;
          }),
          borderColor: "rgba(14,165,233,0.95)",
          borderDash: [4, 3],
          tension: 0.3,
          pointRadius: 3,
          yAxisID: "y1",
        },
      ],
    }),
    [forecast, histCount, labels],
  );

  const options = useMemo<ChartOptions<"line">>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: { labels: { color: "rgba(232,245,238,0.85)" } },
        tooltip: { enabled: true },
        title: {
          display: true,
          text: `Норма T: ${g.temp_min}–${g.temp_max}°C · H: ${g.humidity_min}–${g.humidity_max}%`,
          color: "rgba(232,245,238,0.6)",
          font: { size: 11 },
        },
      },
      scales: {
        x: { ticks: { color: "rgba(232,245,238,0.6)" }, grid: { color: "rgba(232,245,238,0.06)" } },
        y: {
          position: "left",
          ticks: { color: "rgba(232,245,238,0.6)" },
          grid: { color: "rgba(232,245,238,0.06)" },
          title: { display: true, text: "°C", color: "rgba(232,245,238,0.5)" },
        },
        y1: {
          position: "right",
          grid: { drawOnChartArea: false },
          ticks: { color: "rgba(14,165,233,0.8)" },
          title: { display: true, text: "%", color: "rgba(14,165,233,0.6)" },
          min: 0,
          max: 100,
        },
      },
    }),
    [g],
  );

  const plugins = useMemo(() => [riskZonePlugin(g.temp_min, g.temp_max)], [g.temp_min, g.temp_max]);

  return (
    <div className="space-y-3">
      <p className="text-sm text-[var(--muted)]">{forecast.summary}</p>
      <div className="flex flex-wrap gap-3 text-xs">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-3 rounded bg-emerald-500/40 border border-emerald-500/60" /> норма
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-3 rounded bg-yellow-500/40 border border-yellow-500/60" /> предупреждение
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-3 rounded bg-red-500/40 border border-red-500/60" /> опасно
        </span>
      </div>
      <div className="h-[min(22rem,50vh)]">
        <Line data={data} options={options} plugins={plugins} />
      </div>
    </div>
  );
}
