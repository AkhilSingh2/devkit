import { expect, test } from "@playwright/test";

test("home lists tools and exposes the command palette", async ({ page }, testInfo) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "DevKit" })).toBeVisible();
  await expect(page.getByRole("link", { name: /JSON Formatter/ }).first()).toBeVisible();
  if (testInfo.project.name === "mobile") await page.getByRole("button", { name: "Search tools" }).click();
  else await page.keyboard.press("Control+K");
  const dialog = page.getByRole("dialog", { name: "Search tools" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("combobox").fill("jwt");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/jwt-decoder/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/JWT/i);
  const jsonLd = await page.locator('script[type="application/ld+json"]').first().innerHTML();
  expect(jsonLd).toContain("FAQPage");
});

test("json formatter formats in the page", async ({ page }) => {
  await page.goto("/json-formatter/");
  const editor = page.getByRole("textbox", { name: "JSON input" });
  await editor.fill('{"b":1,"a":2}');
  await page.getByRole("button", { name: "Format" }).click();
  await expect(editor).toHaveValue(/\{\n\s+"b": 1/);
  await expect(page.getByText("Formatted.")).toBeVisible();
});

test("kubernetes and cron guides are real pages", async ({ page }) => {
  await page.goto("/yaml-to-json/kubernetes/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Kubernetes YAML to JSON");
  await expect(page.getByRole("textbox", { name: "YAML input" })).toHaveValue(/kind: Deployment/);
  await page.goto("/cron/every-5-minutes/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("every 5 minutes");
  await expect(page.getByText("*/5 * * * *").first()).toBeVisible();
  await expect(page.getByLabel("Cron expression")).toHaveValue("*/5 * * * *");
});

test("chmod calculator shows 755", async ({ page }) => {
  await page.goto("/chmod-calculator/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("chmod calculator");
  await expect(page.getByText("755").first()).toBeVisible();
  await expect(page.getByText("rwxr-xr-x", { exact: true })).toBeVisible();
});
