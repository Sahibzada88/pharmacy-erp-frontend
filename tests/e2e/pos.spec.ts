import { test, expect } from "@playwright/test";

test.describe("POS checkout flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.getByPlaceholder(/e\.g\. cashier1/i).fill("cashier1");
    await page.getByPlaceholder("••••••••").fill("Cashier@12345");
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/pos/);
  });

  test("search, add to cart, and complete a sale shows a receipt with Print/Download", async ({ page }) => {
    // Requires at least one active medicine with stock at the cashier's
    // branch — run the CSV bulk import or seed data first if this is empty.
    const searchBox = page.getByPlaceholder(/search medicine by name/i);
    await searchBox.fill("Panadol");
    await page.waitForTimeout(400); // debounce

    const firstTile = page.locator("button", { hasText: "Panadol" }).first();
    await expect(firstTile).toBeVisible({ timeout: 5000 });
    await firstTile.click();

    // Cart should now show 1 item
    await expect(page.getByText(/1 item/i)).toBeVisible();

    const completeSaleButton = page.getByRole("button", { name: /complete sale/i });
    await expect(completeSaleButton).toBeEnabled();
    await completeSaleButton.click();

    // Receipt modal appears with Print and Download buttons
    await expect(page.getByText(/sale completed/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /^print$/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /download pdf/i })).toBeVisible();

    // Closing returns to an empty cart, ready for the next sale
    await page.getByRole("button", { name: /new sale/i }).click();
    await expect(page.getByText(/cart is empty/i)).toBeVisible();
  });

  test("quantity + button does not exceed available stock", async ({ page }) => {
    // Ventolin Inhaler is seeded with only 4 units in stock (see the bulk
    // import test CSV) — a good low-stock ceiling to verify against.
    const searchBox = page.getByPlaceholder(/search medicine by name/i);
    await searchBox.fill("Ventolin");
    await page.waitForTimeout(400);

    const tile = page.locator("button", { hasText: "Ventolin" }).first();
    const tileVisible = await tile.isVisible().catch(() => false);
    test.skip(!tileVisible, "Ventolin Inhaler not found — import the test CSV first (see medicines_test_import.csv).");

    await tile.click();

    // Click + far more times than the known stock ceiling (4) allows.
    const increaseButtons = page.locator('[data-testid^="cart-qty-increase-"]');
    const increaseButton = increaseButtons.first();
    for (let i = 0; i < 10; i++) {
      await increaseButton.click();
    }

    const qtyDisplay = page.locator('[data-testid^="cart-qty-"]:not([data-testid*="increase"]):not([data-testid*="decrease"])').first();
    await expect(qtyDisplay).toHaveText("4");
  });
});
