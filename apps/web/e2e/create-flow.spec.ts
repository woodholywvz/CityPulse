import { expect, test } from "@playwright/test";

import {
  category,
  citizenUser,
  duplicateResponse,
  publicIssue,
  rewriteResponse,
} from "./helpers/fixtures";
import { mockApi, seedSession } from "./helpers/mock-api";

test("rewrite, duplicate warning, support existing, and submit flow work together", async ({
  page,
}) => {
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
      method: "POST",
      url: /\/api\/public\/issues\/rewrite$/,
      response: rewriteResponse,
    },
    {
      method: "POST",
      url: /\/api\/public\/issues\/duplicates$/,
      response: duplicateResponse,
    },
    {
      method: "POST",
      url: /\/api\/public\/issues\/issue-1\/support$/,
      response: {
        issue_id: "issue-1",
        public_impact_score: 8.9,
        affected_people_estimate: 210,
      },
    },
    {
      method: "POST",
      url: /\/api\/issues$/,
      response: {
        ...publicIssue,
        author_id: citizenUser.id,
        status: "pending_moderation",
        moderation_state: "queued",
        source_locale: "en",
        attachments: [],
        latest_moderation: {
          id: "mod-1",
          layer: "deterministic",
          status: "approved",
          decision_code: "pass",
          provider_name: null,
          model_name: null,
          machine_reasons: [],
          user_safe_explanation: "Your report is in the moderation queue.",
          internal_notes: null,
          summary: "Passed first checks.",
          created_at: "2026-04-04T09:00:00Z",
        },
      },
    },
  ]);

  await page.goto("/en/create");

  await page.getByLabel("Short title").fill("crosswalk lights are BROKEN and nobody fixes this");
  await page
    .getByLabel("Description")
    .fill("The crossing is dangerous and the signal has been dead for two evenings.");
  await page.getByLabel("Category").selectOption(category.id);
  await page.getByRole("button", { name: "Improve text" }).click();

  await expect(page.getByText(rewriteResponse.rewritten_title)).toBeVisible();
  await page.getByRole("button", { name: "Use rewrite" }).click();
  await expect(page.getByText("Rewrite applied to the draft.")).toBeVisible();

  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByLabel("Latitude").fill("43.2389");
  await page.getByLabel("Longitude").fill("76.8897");
  await page.getByRole("button", { name: "Continue" }).click();

  await expect(page.getByText("Possible duplicate issues")).toBeVisible();
  await page.getByRole("button", { name: "Supporting an existing issue is faster" }).click();
  await expect(page.getByText("Existing issue supported.")).toBeVisible();

  await page.getByRole("button", { name: "Submit anyway" }).click();
  await expect(page.getByRole("heading", { name: "Issue accepted for the moderation queue" })).toBeVisible();
});
