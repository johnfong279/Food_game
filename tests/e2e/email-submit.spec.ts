import { test, expect } from "@playwright/test";

type AnalyticsEvent = {
  eventName?: string;
  eventType?: string;
};

async function completeRoundAndOpenClaim(
  page: import("@playwright/test").Page,
  analyticsEvents: AnalyticsEvent[] = []
) {
  await page.setViewportSize({ width: 400, height: 700 });

  await page.route("**/api/analytics/track", async (route) => {
    analyticsEvents.push(route.request().postDataJSON() as AnalyticsEvent);
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true }),
    });
  });

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
  const analyticsEvents: AnalyticsEvent[] = [];
  await completeRoundAndOpenClaim(page, analyticsEvents);

  await expect(page.getByText("Enter your email")).toBeVisible();
  await expect(page.getByText("FREE POTATO STICKS!")).toBeVisible();
  await expect(page.getByText(/Top 3 players/i)).toBeVisible();
  await expect(page.getByText(/win \$30 credits!/i)).toBeVisible();
  await expect(page.getByPlaceholder("your name")).toBeVisible();
  await expect(page.locator('input[type="email"]')).toBeVisible();
  await expect(page.getByLabel(/I agree to the Terms & Conditions/i)).toBeVisible();
  await page.getByRole("button", { name: "Terms & Conditions" }).click();
  await expect(page.getByRole("dialog", { name: "Terms & Conditions" })).toBeVisible();
  await page.getByRole("button", { name: "Close terms modal" }).click();
  await expect(page.getByRole("dialog", { name: "Terms & Conditions" })).toBeHidden();
  expect(analyticsEvents.some((event) => event.eventName === "terms_open_click")).toBe(true);
  expect(analyticsEvents.some((event) => event.eventName === "terms_close_click")).toBe(true);
  await expect(page.getByLabel(/I agree to receive marketing emails/i)).toBeVisible();
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
  await page.getByLabel(/I agree to the Terms & Conditions/i).check();
  await page.getByLabel(/I agree to receive marketing emails/i).check();
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
  await page.getByLabel(/I agree to the Terms & Conditions/i).check();
  await page.getByLabel(/I agree to receive marketing emails/i).check();
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
  await page.getByLabel(/I agree to the Terms & Conditions/i).check();
  await page.getByLabel(/I agree to receive marketing emails/i).check();
  await page.getByRole("button", { name: "GET MY SNACK" }).click();

  await expect(page.getByRole("dialog", { name: "Email already used" })).toBeVisible();
  await expect(page.getByText("Each email can be used one time.")).toBeVisible();
  await page.getByRole("button", { name: "OK" }).click();
  await expect(page.getByRole("button", { name: "GET MY SNACK" })).toBeVisible();
});
