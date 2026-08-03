import { test, expect } from "@playwright/test";

/**
 * Full happy-path auth flow: register -> log in -> land on the dashboard ->
 * log out. Accounts are verified immediately at registration (see
 * auth.service.ts) rather than gated on clicking an emailed link, since
 * this app's transactional email provider can't actually deliver to
 * arbitrary recipients without a verified sending domain.
 */
test("register, log in, and log out", async ({ page }) => {
  const email = `e2e-${Date.now()}@example.com`;
  const password = "TestPassword1";
  const name = "E2E Tester";

  await page.goto("/register");
  await page.getByLabel("Name").fill(name);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(page.getByText("Account created")).toBeVisible();

  await page.getByRole("link", { name: "Log in" }).click();
  await expect(page).toHaveURL(/\/login/);

  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Log in" }).click();

  await expect(page).toHaveURL(/\/dashboard/);
  await expect(
    page.getByText(`Welcome back, ${name.split(" ")[0]}`),
  ).toBeVisible();

  await page.getByRole("button", { name: name }).click();
  await page.getByRole("menuitem", { name: "Log out" }).click();

  await expect(page).toHaveURL("http://localhost:3000/");
});

test("shows an error for invalid login credentials", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("nobody@example.com");
  await page.getByLabel("Password").fill("WrongPassword1");
  await page.getByRole("button", { name: "Log in" }).click();

  await expect(page.getByText("Invalid email or password.")).toBeVisible();
});
