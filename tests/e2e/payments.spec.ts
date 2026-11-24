import { expect, test } from "@playwright/test";

test.setTimeout(90_000);

test("status tabs, advanced filters, columns, and pagination are interactive", async ({ page }) => {
  const failedRequests: string[] = [];
  page.on("response", response => { if (response.url().includes("/api/payments") && response.status() >= 500) failedRequests.push(String(response.status())); });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Payments" })).toBeVisible();
  await expect(page.locator(".toolbar").getByRole("button", { name: "Status" })).toHaveCount(0);

  await page.getByRole("button", { name: "Refunded" }).click();
  await expect(page.getByRole("button", { name: "Refunded" })).toHaveClass(/selected/);
  await expect(page.locator("tbody tr").first()).toContainText("Refunded");
  await page.getByRole("button", { name: "All", exact: true }).click();

  await page.getByRole("button", { name: /More filters|\d+ filters?/ }).click();
  await page.getByRole("button", { name: "Currency" }).click();
  await page.locator(".advanced-popover").getByText("BRL", { exact: true }).click();
  await expect(page.getByRole("button", { name: /More filters|\d+ filters?/ })).toHaveClass(/active/);
  await page.getByRole("button", { name: /More filters|\d+ filters?/ }).click();
  await page.getByRole("button", { name: "Type", exact: true }).click();
  await page.locator(".advanced-popover").getByText("Card", { exact: true }).click();
  await page.getByRole("button", { name: /More filters|\d+ filters?/ }).click();
  await page.getByRole("button", { name: "Created at", exact: true }).click();
  await page.locator(".advanced-popover").getByRole("combobox").selectOption("7 days");
  await expect(page.locator("tbody tr").first()).toContainText("Visa");
  await expect(page.locator("tbody tr").first()).toContainText("BRL");

  await page.getByRole("button", { name: "Adjust columns" }).click();
  await expect(page.getByText("Table settings")).toBeVisible();
  await page.locator(".columns-popover").getByText("Currency", { exact: true }).click();
  await expect(page.getByRole("columnheader", { name: "Currency" })).toHaveCount(0);

  await page.screenshot({ path: "test-results/payments-controls.png", fullPage: true });
  expect(failedRequests).toEqual([]);
});

test("pagination, copy, navigation and browser health", async ({ page, context }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/");
  await expect(page.locator("tbody tr").first()).toBeVisible();
  await expect(page.getByLabel("Next page")).toBeEnabled();
  const firstId = await page.locator("tbody tr").first().getByRole("button", { name: /^Copy / }).getAttribute("aria-label");
  await page.locator("tbody tr").first().getByRole("button", { name: /^Copy / }).click();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(firstId?.slice(5));
  await page.getByLabel("Next page").click();
  await expect(page.locator(".page-count")).toContainText("2 /");
  await expect(page.locator("tbody tr").first().getByRole("button", { name: /^Copy / })).not.toHaveAttribute("aria-label", firstId!);
  await page.getByRole("link", { name: "Home" }).click();
  await expect(page).toHaveURL(/\/home$/);
  await page.goBack();
  await expect(page.getByRole("heading", { name: "Payments" })).toBeVisible();
  await page.getByRole("link", { name: "Customers" }).click();
  await expect(page).toHaveURL(/\/customers$/);
  await page.getByRole("link", { name: "Balances" }).click();
  await expect(page).toHaveURL(/\/balances$/);
  expect(errors).toEqual([]);
});

test("shows selected filters and applies a custom date range", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "More filters" }).click();
  await page.locator(".advanced-popover").getByRole("button", { name: "Status", exact: true }).click();
  await page.locator(".advanced-popover").getByText("Succeeded", { exact: true }).click();
  await page.locator(".advanced-popover").getByText("Refunded", { exact: true }).click();
  await page.locator(".advanced-popover").getByRole("button", { name: "Status", exact: true }).click();
  await expect(page.getByRole("button", { name: "Clear Status filter" })).toContainText("Succeeded, Refunded");
  await page.getByRole("button", { name: "Clear Status filter" }).click();
  await page.getByRole("button", { name: "Currency", exact: true }).click();
  await page.locator(".advanced-popover").getByText("USD", { exact: true }).click();
  await page.getByRole("button", { name: "1 filter" }).click();
  await expect(page.getByRole("button", { name: "Clear Currency filter" })).toContainText("USD");
  await page.getByRole("button", { name: "Created at", exact: true }).click();
  await page.getByLabel("Created within").selectOption("Custom");
  await page.getByLabel("From (UTC)").fill("2026-11-17");
  await page.getByLabel("To (UTC)").fill("2026-11-17");
  const results = page.waitForResponse(response => response.url().includes("range=Custom") && response.url().includes("from=2026-11-17"));
  await page.getByRole("button", { name: "Apply", exact: true }).click();
  const result = await results;
  expect(result.status()).toBe(200);
  const body = await result.json();
  expect(body.total).toBeGreaterThan(0);
  expect(body.payments.every((payment: { created: string }) => payment.created.startsWith("2026-11-17"))).toBe(true);
  await page.getByRole("button", { name: "2 filters" }).click();
  await expect(page.getByRole("button", { name: "Clear Created at filter" })).toContainText("2026-11-17");
  await page.getByRole("button", { name: "Clear Currency filter" }).click();
  await expect(page.getByRole("button", { name: "Clear Currency filter" })).toHaveCount(0);
});
