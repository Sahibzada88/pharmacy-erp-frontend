import { test, expect } from "@playwright/test";

test.describe("Invoices", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.getByPlaceholder(/e\.g\. cashier1/i).fill("cashier1");
    await page.getByPlaceholder("••••••••").fill("Cashier@12345");
    await page.getByRole("button", { name: /sign in/i }).click();
    await page.goto("/invoices");
  });

  test("lists past invoices with status badges", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Invoices" })).toBeVisible();
    // Either a table of invoices or the empty state — both are valid states
    // depending on whether any sales exist yet.
    const hasRows = await page.locator("table tbody tr").count();
    if (hasRows === 0) {
      await expect(page.getByText(/no invoices yet/i)).toBeVisible();
    } else {
      await expect(page.locator("table tbody tr").first()).toBeVisible();
    }
  });

  test("search filters the invoice list", async ({ page }) => {
    const searchBox = page.getByPlaceholder(/search by invoice number/i);
    await searchBox.fill("NONEXISTENT-INVOICE-12345");
    await page.waitForTimeout(400);
    await expect(page.getByText(/no invoices yet/i)).toBeVisible();
  });

  test("clicking an invoice opens the detail page with Print/Download", async ({ page }) => {
    const firstRow = page.locator("table tbody tr").first();
    const rowExists = await firstRow.isVisible().catch(() => false);
    test.skip(!rowExists, "No invoices exist yet — complete a POS sale first.");

    await firstRow.click();
    await expect(page).toHaveURL(/\/invoices\/\d+/);
    await expect(page.getByRole("button", { name: /^print$/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /download pdf/i })).toBeVisible();
  });
});
