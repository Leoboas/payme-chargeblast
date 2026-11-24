import { expect, test } from "@playwright/test";

test.setTimeout(90_000);

test("status tabs, advanced filters, columns, and pagination are interactive", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Payments" })).toBeVisible();
  await expect(page.locator(".toolbar").getByRole("button", { name: "Status" })).toHaveCount(0);

  await page.getByRole("button", { name: "Refunded" }).click();
  await expect(page.getByRole("button", { name: "Refunded" })).toHaveClass(/selected/);
  await expect(page.locator("tbody tr").first()).toContainText("Refunded");
  await page.getByRole("button", { name: "All", exact: true }).click();

  await page.getByRole("button", { name: "More filters" }).click();
  await page.getByRole("button", { name: "Currency" }).click();
  await page.locator(".advanced-popover").getByText("BRL", { exact: true }).click();
  await expect(page.getByRole("button", { name: "More filters" })).toHaveClass(/active/);
  await page.getByRole("button", { name: "More filters" }).click();
  await page.getByRole("button", { name: "Type", exact: true }).click();
  await page.locator(".advanced-popover").getByText("Card", { exact: true }).click();
  await page.getByRole("button", { name: "More filters" }).click();
  await page.getByRole("button", { name: "Created at", exact: true }).click();
  await page.locator(".advanced-popover").getByRole("combobox").selectOption("7 days");
  await expect(page.locator("tbody tr").first()).toContainText("Visa");
  await expect(page.locator("tbody tr").first()).toContainText("BRL");

  await page.getByRole("button", { name: "Adjust columns" }).click();
  await expect(page.getByText("Table settings")).toBeVisible();
  await page.locator(".columns-popover").getByText("Currency", { exact: true }).click();
  await expect(page.getByRole("columnheader", { name: "Currency" })).toHaveCount(0);

  await page.screenshot({ path: "test-results/payments-controls.png", fullPage: true });
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
  expect(errors).toEqual([]);
});
