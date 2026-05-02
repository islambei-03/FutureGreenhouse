import { test, expect } from "@playwright/test";

test("smoke: login and open dashboard", async ({ page }) => {
  await page.goto("/login");

  // В форме логина placeholders: "например: admin" и локализованный "Пароль".
  await page.getByPlaceholder(/admin/i).fill("admin");
  await page.getByPlaceholder(/парол/i).fill("admin123");
  const [loginRes] = await Promise.all([
    page.waitForResponse((r) => r.url().includes("/api/auth/login") && r.request().method() === "POST"),
    page.getByRole("button", { name: /войти/i }).click(),
  ]);
  expect(loginRes.status()).toBe(200);

  // Должны оказаться внутри приложения
  await expect(page).toHaveURL(/\/(?!login)/);

  // KPI должен открываться как страница приложения (через browser fetch с cookie).
  // Дёргаем напрямую из браузера.
  const kpiRes = await page.evaluate(async () => {
    const r = await fetch("/api/kpi");
    return { status: r.status, body: await r.json().catch(() => null) };
  });
  expect(kpiRes.status).toBe(200);
  expect(kpiRes.body?.ok).toBe(true);
});

