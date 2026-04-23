import { test, expect } from "@playwright/test";

test("landing page loads and shows start button", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: /start game/i })).toBeVisible();
  await expect(page.getByText("Sakura Snack")).toBeVisible();
});

test("start button is clickable (session API must be configured)", async ({ page }) => {
  await page.goto("/");
  const startBtn = page.getByRole("button", { name: /start game/i });
  await expect(startBtn).toBeEnabled();
});
