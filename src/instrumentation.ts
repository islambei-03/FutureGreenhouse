export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  try {
    const { ensureDbReady } = await import("@/lib/db");
    await ensureDbReady();
  } catch (e) {
    console.error("[instrumentation] ensureDbReady", e);
    return;
  }

  try {
    const { restoreSensorSimulationFromDb } = await import("@/lib/sensor-simulation");
    await restoreSensorSimulationFromDb();
  } catch (e) {
    console.error("[instrumentation] sensor-simulation", e);
  }
}
