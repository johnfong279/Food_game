import { test, expect } from "@playwright/test";

async function completeRoundAndOpenClaim(page: import("@playwright/test").Page) {
  await page.setViewportSize({ width: 400, height: 700 });

  await page.route("**/api/session/start", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ sessionToken: "test-session-token" }),
    });
  });

  await page.route("**/api/score/submit", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ rank: 12, totalPlayers: 20, discountCode: "TESTSNACK" }),
    });
  });

  await page.goto("/");
  await page.getByRole("button", { name: /start game/i }).click();
  await expect(page.getByRole("button", { name: /claim my snack/i })).toBeVisible({
    timeout: 70_000,
  });
  await page.getByRole("button", { name: /claim my snack/i }).click();
}

test("claim snack screen has email input and consent checkbox", async ({ page }) => {
  await completeRoundAndOpenClaim(page);

  await expect(page.getByRole("heading", { name: "YOU'RE IN!" })).toBeVisible();
  await expect(page.getByText("Enter your email")).toBeVisible();
  await expect(page.getByText("FREE SNACK!")).toBeVisible();
  await expect(page.getByPlaceholder("your name")).toBeVisible();
  await expect(page.locator('input[type="email"]')).toBeVisible();
  await expect(page.locator('input[type="checkbox"]')).toBeVisible();
  await expect(page.getByRole("button", { name: "GET MY SNACK" })).toBeVisible();
});

test("successful claim shows promo code, copy button, and leaderboard button", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-write"], { origin: "http://localhost:3000" });
  await page.route("**/api/email/submit", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true }),
    });
  });

  await completeRoundAndOpenClaim(page);
  await page.getByPlaceholder("your name").fill("Snack Player");
  await page.locator('input[type="email"]').fill("player@example.com");
  await page.locator('input[type="checkbox"]').check();
  await page.getByRole("button", { name: "GET MY SNACK" }).click();

  await expect(page.getByText("TESTSNACK")).toBeVisible();
  await expect(page.getByRole("button", { name: "Copy" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Leaderboard" })).toBeVisible();
  await page.getByRole("button", { name: "Copy" }).click();
  await expect(page.getByRole("button", { name: "Copied" })).toBeVisible();
});

test("failed claim shows error and keeps submit button available", async ({ page }) => {
  await page.route("**/api/email/submit", async (route) => {
    await route.fulfill({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify({ error: "Email check failed" }),
    });
  });

  await completeRoundAndOpenClaim(page);
  await page.getByPlaceholder("your name").fill("Snack Player");
  await page.locator('input[type="email"]').fill("player@example.com");
  await page.locator('input[type="checkbox"]').check();
  await page.getByRole("button", { name: "GET MY SNACK" }).click();

  await expect(page.getByRole("alert").filter({ hasText: "Email check failed" })).toBeVisible();
  await expect(page.getByRole("button", { name: "GET MY SNACK" })).toBeVisible();
});

test("duplicate email shows one-time-use modal", async ({ page }) => {
  await page.route("**/api/email/submit", async (route) => {
    await route.fulfill({
      status: 409,
      contentType: "application/json",
      body: JSON.stringify({ error: "Each email can be used one time." }),
    });
  });

  await completeRoundAndOpenClaim(page);
  await page.getByPlaceholder("your name").fill("Snack Player");
  await page.locator('input[type="email"]').fill("player@example.com");
  await page.locator('input[type="checkbox"]').check();
  await page.getByRole("button", { name: "GET MY SNACK" }).click();

  await expect(page.getByRole("dialog", { name: "Email already used" })).toBeVisible();
  await expect(page.getByText("Each email can be used one time.")).toBeVisible();
  await page.getByRole("button", { name: "OK" }).click();
  await expect(page.getByRole("button", { name: "GET MY SNACK" })).toBeVisible();
});
