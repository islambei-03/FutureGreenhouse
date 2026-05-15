import fs from "fs";

const p = new URL("../src/app/(app)/ai/page.tsx", import.meta.url);
let s = fs.readFileSync(p, "utf8");

const start = s.indexOf('{tab === "health"');
const end = s.indexOf('{tab === "recommendations"');
if (start < 0 || end < 0) throw new Error("markers not found");

const insert = `      {tab === "anomaly" ? (
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
          <AnomalyDetectorPanel />
        </section>
      ) : null}

`;

s = s.slice(0, start) + insert + s.slice(end);

s = s.replace(
  `{tr("ai.forecast.empty")}</p>}\n        </section>`,
  `{tr("ai.forecast.empty")}</p>}\n          <AiTabInfo titleKey="ai.info.forecast.title" bodyKey="ai.info.forecast.body" dataKey="ai.info.forecast.data" />\n        </section>`,
);

s = s.replace(
  `          )}\n        </section>\n      ) : null}\n\n      {tab === "map"`,
  `          )}\n          <AiTabInfo titleKey="ai.info.recommendations.title" bodyKey="ai.info.recommendations.body" dataKey="ai.info.recommendations.data" />\n        </section>\n      ) : null}\n\n      {tab === "map"`,
);

s = s.replace(
  `<GreenhouseMap />\n        </section>`,
  `<GreenhouseMap />\n          <AiTabInfo titleKey="ai.info.map.title" bodyKey="ai.info.map.body" dataKey="ai.info.map.data" />\n        </section>`,
);

s = s.replace(
  `<WeekPlanner />\n        </section>\n      ) : null}\n    </main>`,
  `<WeekPlanner />\n          <AiTabInfo titleKey="ai.info.planner.title" bodyKey="ai.info.planner.body" dataKey="ai.info.planner.data" />\n        </section>\n      ) : null}\n\n      {tab === "training" ? (\n        <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">\n          <TrainingTour />\n        </section>\n      ) : null}\n    </main>`,
);

fs.writeFileSync(p, s);
console.log("patched ai page");
