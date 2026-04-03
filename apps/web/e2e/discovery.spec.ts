import { expect, test } from "@playwright/test";

import { category, citizenUser, publicIssue } from "./helpers/fixtures";
import { mockApi, seedSession } from "./helpers/mock-api";

test("discover feed supports swipe actions and public heatmap renders", async ({ page }) => {
  await seedSession(page, "citizen-token");
  await mockApi(page, [
    {
      method: "GET",
      url: /\/api\/users\/me$/,
      response: citizenUser,
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
      method: "POST",
      url: /\/api\/public\/issues\/issue-1\/feedback$/,
      response: {
        saved: true,
      },
    },
    {
      method: "GET",
      url: /\/api\/public\/issues\/heatmap/,
      response: [
        {
          area_key: "cell-1",
          label: "Central district",
          latitude: publicIssue.latitude,
          longitude: publicIssue.longitude,
          intensity: 0.72,
          issue_count: 8,
          top_category_slug: category.slug,
        },
      ],
    },
  ]);

  await page.goto("/en/discover");
  await expect(page.getByRole("heading", { name: "Swipe through public issues" })).toBeVisible();
  await page.getByRole("button", { name: "Support this issue" }).nth(0).click();
  await expect(page.getByText("Feedback saved.")).toBeVisible();

  await page.goto("/en/issues/heatmap");
  await expect(page.getByRole("heading", { name: "See where city pressure is building" })).toBeVisible();
  await expect(page.getByText("Current hot spots")).toBeVisible();
});
