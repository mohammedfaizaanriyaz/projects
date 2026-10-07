const { test, expect } = require("@playwright/test");
const AxeBuilder = require("@axe-core/playwright").default;

async function login(page) {
  const response = await page.request.post("/api/auth/login", {
    headers: { "X-Vyra-Request": "1" }, data: { email: "student@example.com", password: "test-only-password" },
  });
  expect(response.status()).toBe(200);
}
test.beforeEach(async ({ page }) => {
  // Font availability must not determine application correctness.
  await page.route(/https:\/\/fonts\.(googleapis|gstatic)\.com\//, (route) => route.abort());
});

test("login, refresh and logout use the real API session", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Email", { exact: true }).fill("student@example.com");
  await page.getByLabel("Password", { exact: true }).fill("test-only-password");
  await page.getByRole("button", { name: "Enter VYRA" }).click();
  await expect(page.locator(".main-shell h1")).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Selected profile")).toHaveValue("10");
  await page.getByRole("button", { name: "Logout", exact: true }).click();
  await expect(page.getByRole("button", { name: "Enter VYRA" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("button", { name: "Enter VYRA" })).toBeVisible();
});

test("all page URLs render on desktop and mobile without runtime errors or overflow", async ({ page }) => {
  test.setTimeout(120000);
  await login(page);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const pages = ["dashboard", "profiles", "health", "weight", "measurements", "body-metrics", "nutrition", "meals", "meal-history", "recipes", "tasks", "reminders", "progress", "settings"];
  for (const width of [1440, 375]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of pages) {
      await page.goto(`/#/${route}`);
      await expect(page.locator(".main-shell h1")).toBeVisible();
      await expect(page.getByRole("alert")).toHaveCount(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      if (width === 1440) {
        const accessibility = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
        expect(accessibility.violations, `Accessibility of ${route}`).toEqual([]);
      }
      if (["dashboard", "tasks", "nutrition"].includes(route)) {
        await page.screenshot({ path: `test-results/${route}-${width}.png`, fullPage: true, animations: "disabled" });
      }
    }
  }
  expect(errors).toEqual([]);
});

test("mobile navigation traps focus, closes on Escape and restores the opener", async ({ page }) => {
  await login(page);
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/#/settings");
  const opener = page.getByRole("button", { name: "Open navigation" });
  await opener.click();
  await expect(page.getByRole("dialog", { name: "Main navigation" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Close navigation" })).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(page.getByRole("button", { name: "Logout", exact: true })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Close navigation" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(opener).toBeFocused();
  await expect(opener).toHaveAttribute("aria-expanded", "false");
  await opener.click();
  await page.screenshot({ path: "test-results/mobile-menu-open.png", fullPage: true, animations: "disabled" });
  await page.getByRole("button", { name: "Close navigation" }).click();
  await expect(opener).toBeFocused();
  await page.screenshot({ path: "test-results/mobile-settings.png", fullPage: true });
});

test("weight save preserves confirmation and incorrect entries can be removed", async ({ page }) => {
  await login(page);
  await page.goto("/#/weight");
  await page.getByRole("button", { name: "Add record" }).click();
  await page.getByLabel("Weight (kg)", { exact: true }).fill("72.5");
  await page.getByLabel("Date measured").fill("2026-10-01");
  await page.getByRole("button", { name: "Save weight" }).click();
  await expect(page.getByText("Weight saved.", { exact: false })).toBeVisible();
  await expect(page.getByRole("row").filter({ hasText: "2026-10-01" })).toContainText("72.5 kg");
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Delete weight on 2026-10-01" }).click();
  await expect(page.getByRole("button", { name: "Delete weight on 2026-10-01" })).toHaveCount(0);
  await expect(page.getByText("Weight record deleted.", { exact: true })).toBeVisible();
});

test("unit preferences apply to health overview and progress after reload", async ({ page }) => {
  await login(page);
  await page.goto("/#/settings");
  await page.getByLabel("Weight unit").selectOption("lb");
  await page.getByLabel("Length unit").selectOption("in");
  await page.goto("/#/health");
  await expect(page.locator(".stats-grid")).toContainText("154.32 lb");
  await expect(page.locator(".stats-grid")).toContainText("66.93 in");
  await page.goto("/#/progress");
  await expect(page.locator(".stats-grid")).toContainText("154.32 lb");
});

test("tasks support descriptions, time limits, editing and list renaming", async ({ page }) => {
  await login(page);
  await page.goto("/#/tasks");
  await page.getByLabel("New list name").fill("Daily routine");
  await page.getByRole("button", { name: "Add", exact: true }).click();
  await page.getByLabel("Task title", { exact: true }).fill("Walk");
  await page.getByLabel("Task description").fill("Walk around the park");
  await page.getByLabel("Time limit (minutes, optional)").fill("20");
  await page.getByRole("button", { name: "Add task", exact: true }).click();
  await expect(page.locator(".task-row")).toContainText("Walk around the park");
  await expect(page.locator(".task-row")).toContainText("20 minutes");
  await page.getByRole("button", { name: "Edit Walk", exact: true }).click();
  await page.getByLabel("Task title", { exact: true }).fill("Evening walk");
  await page.getByRole("button", { name: "Save task", exact: true }).click();
  await expect(page.locator(".task-row")).toContainText("Evening walk");
  await page.getByLabel("Rename selected list").fill("Fitness");
  await page.getByRole("button", { name: "Rename", exact: true }).click();
  await expect(page.locator(".task-main-card h3")).toHaveText("Fitness");
  await page.getByRole("button", { name: "Complete Evening walk", exact: true }).click();
  await expect(page.getByRole("button", { name: "Mark Evening walk incomplete" })).toBeVisible();
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Delete list", exact: true }).click();
  await expect(page.getByText("Create your first list to get started.")).toBeVisible();
});

test("USDA calculation flows through Express into the daily nutrition log", async ({ page }) => {
  await login(page);
  await page.goto("/#/nutrition");
  await page.getByLabel("Search foods", { exact: true }).fill("banana");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await page.getByRole("button", { name: "Banana Foundation" }).click();
  await page.getByLabel("Quantity", { exact: true }).fill("100");
  await page.getByRole("button", { name: "Calculate", exact: true }).click();
  await page.getByRole("button", { name: /^Add to \d/ }).click();
  await expect(page.getByText(/Banana added to/)).toBeVisible();
  await page.goto("/#/meal-history");
  await expect(page.locator(".meal-row")).toContainText("Banana");
  await expect(page.locator(".meal-row")).toContainText("89 kcal");
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Remove Banana" }).click();
  await expect(page.getByText(/No foods logged for/)).toBeVisible();
});
