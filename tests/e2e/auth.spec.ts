import { test, expect } from "@playwright/test";

/**
 * Uses the seeded demo accounts from `python manage.py seed_demo_data`:
 * owner / Owner@12345, manager1 / Manager@12345, cashier1 / Cashier@12345,
 * accountant1 / Accountant@12345, pharmacist1 / Pharmacist@12345.
 */
const ACCOUNTS = [
  { username: "owner", password: "Owner@12345", expectedPath: "/owner" },
  { username: "manager1", password: "Manager@12345", expectedPath: "/owner" },
  { username: "cashier1", password: "Cashier@12345", expectedPath: "/pos" },
  { username: "accountant1", password: "Accountant@12345", expectedPath: "/finance" },
  { username: "pharmacist1", password: "Pharmacist@12345", expectedPath: "/inventory" },
];

test.describe("Login and role-based redirect", () => {
  for (const account of ACCOUNTS) {
    test(`${account.username} redirects to ${account.expectedPath}`, async ({ page }) => {
      await page.goto("/login");
      await page.getByPlaceholder(/e\.g\. cashier1/i).fill(account.username);
      await page.getByPlaceholder("••••••••").fill(account.password);
      await page.getByRole("button", { name: /sign in/i }).click();

      await expect(page).toHaveURL(new RegExp(account.expectedPath));
    });
  }

  test("wrong password shows inline error and stays on login page", async ({ page }) => {
    await page.goto("/login");
    await page.getByPlaceholder(/e\.g\. cashier1/i).fill("owner");
    await page.getByPlaceholder("••••••••").fill("WrongPassword123");
    await page.getByRole("button", { name: /sign in/i }).click();

    await expect(page.getByText(/invalid|could not sign in/i)).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe("Session and navigation", () => {
  test("owner sees all sidebar nav items; cashier sees a limited set", async ({ page }) => {
    await page.goto("/login");
    await page.getByPlaceholder(/e\.g\. cashier1/i).fill("owner");
    await page.getByPlaceholder("••••••••").fill("Owner@12345");
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/owner/);

    for (const label of ["Overview", "Point of Sale", "Inventory", "Suppliers", "Finance", "Customers", "Staff", "Branches"]) {
      await expect(page.getByRole("link", { name: label })).toBeVisible();
    }

    await page.getByRole("button", { name: /sign out/i }).click();
    await expect(page).toHaveURL(/\/login/);

    await page.getByPlaceholder(/e\.g\. cashier1/i).fill("cashier1");
    await page.getByPlaceholder("••••••••").fill("Cashier@12345");
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/pos/);

    await expect(page.getByRole("link", { name: "Point of Sale" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Suppliers" })).not.toBeVisible();
    await expect(page.getByRole("link", { name: "Finance" })).not.toBeVisible();
    await expect(page.getByRole("link", { name: "Branches" })).not.toBeVisible();
  });

  test("refreshing the page keeps the user logged in", async ({ page }) => {
    await page.goto("/login");
    await page.getByPlaceholder(/e\.g\. cashier1/i).fill("cashier1");
    await page.getByPlaceholder("••••••••").fill("Cashier@12345");
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/pos/);

    await page.reload();
    await expect(page).toHaveURL(/\/pos/);
    await expect(page.getByRole("link", { name: "Point of Sale" })).toBeVisible();
  });
});
