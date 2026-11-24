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
  await page.locator(".advanced-popover").getByRole("button").first().click();
  await page.getByRole("button", { name: "Type", exact: true }).click();
  await page.locator(".advanced-popover").getByText("Card", { exact: true }).click();
  await page.locator(".advanced-popover").getByRole("button").first().click();
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
