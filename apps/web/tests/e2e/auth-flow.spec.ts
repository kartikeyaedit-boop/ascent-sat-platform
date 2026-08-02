import { test, expect } from "@playwright/test";

/**
 * Full happy-path auth flow: register -> verify email (via the test-only
 * /api/test/last-email endpoint, which stands in for reading a real inbox)
 * -> log in -> land on the dashboard -> log out.
 */
test("register, verify, log in, and log out", async ({ page, request }) => {
  const email = `e2e-${Date.now()}@example.com`;
  const password = "TestPassword1";
  const name = "E2E Tester";

  await page.goto("/register");
  await page.getByLabel("Name").fill(name);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(page.getByText("Check your email")).toBeVisible();

  const emailResponse = await request.get(
    `/api/test/last-email?to=${encodeURIComponent(email)}`,
  );
  expect(emailResponse.ok()).toBeTruthy();
  const { data } = await emailResponse.json();
  const match = data.email.text.match(/verify-email\?token=([a-f0-9]+)/);
  expect(match).not.toBeNull();
  const token = match![1];

  await page.goto(`/verify-email?token=${token}`);
  await expect(page.getByText("Email verified")).toBeVisible();

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
