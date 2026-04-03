import { expect, test } from "@playwright/test";

import { citizenUser, category, publicIssue } from "./helpers/fixtures";
import { mockApi } from "./helpers/mock-api";

test("register and login route into the citizen workspace", async ({ page }) => {
  await mockApi(page, [
    {
      method: "POST",
      url: /\/api\/auth\/register$/,
      response: citizenUser,
    },
    {
      method: "POST",
      url: /\/api\/auth\/login$/,
      response: {
        access_token: "citizen-token",
        token_type: "bearer",
        user: citizenUser,
      },
    },
    {
      method: "GET",
      url: /\/api\/public\/categories$/,
      response: [category],
    },
    {
      method: "GET",
      url: /\/api\/public\/issues\/feed/,
      response: [publicIssue],
    },
    {
      method: "GET",
      url: /\/api\/public\/issues$/,
      response: [publicIssue],
    },
  ]);

  await page.goto("/en/auth");

  await page.getByRole("button", { name: "Create account" }).first().click();
  await page.getByLabel("Full name").fill("Amina Sarsen");
  await page.getByLabel("Email").fill("citizen@example.com");
  await page.getByLabel("Password").fill("password-123");
  await page.getByLabel("Preferred locale").selectOption("en");
  await page.getByRole("button", { name: "Create account" }).nth(1).click();

  await expect(page.getByText("Account created.")).toBeVisible();

  await page.getByLabel("Email").fill("citizen@example.com");
  await page.getByLabel("Password").fill("password-123");
  await page.getByRole("button", { name: "Sign in" }).nth(1).click();

  await page.waitForURL("**/en/discover");
  await expect(page.getByRole("heading", { name: "Swipe through public issues" })).toBeVisible();
});
