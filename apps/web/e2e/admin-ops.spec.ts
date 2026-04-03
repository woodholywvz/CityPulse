import { expect, test } from "@playwright/test";

import { adminUser, category, citizenUser } from "./helpers/fixtures";
import { mockApi, seedSession } from "./helpers/mock-api";

const integritySummary = {
  user: {
    ...citizenUser,
    last_login_at: "2026-04-04T07:00:00Z",
  },
  trust_score: 7.4,
  trust_weight_multiplier: 1.08,
  abuse_risk_level: "low" as const,
  abuse_risk_score: 12.3,
  sanction_count: 0,
  summary: "Stable participation",
  updated_at: "2026-04-04T08:00:00Z",
  trust_factors: [],
  abuse_factors: [],
  recommended_actions: [],
  metrics: {},
};

test("admin moderation queue loads and rerun action responds", async ({ page }) => {
  await seedSession(page, "admin-token");
  await mockApi(page, [
    {
      method: "GET",
      url: /\/api\/users\/me$/,
      response: adminUser,
    },
    {
      method: "GET",
      url: /\/api\/admin\/moderation\/issues\?limit=30$/,
      response: [
        {
          id: "issue-1",
          author: integritySummary,
          title: "Broken crossing lights",
          short_description: "Unsafe crossing signal.",
          source_locale: "en",
          status: "pending_moderation",
          moderation_state: "under_review",
          category,
          created_at: "2026-04-04T08:00:00Z",
          updated_at: "2026-04-04T08:30:00Z",
          attachment_count: 1,
          latest_moderation: {
            id: "mod-1",
            layer: "deterministic",
            status: "needs_review",
            decision_code: "tone_flagged",
            provider_name: null,
            model_name: null,
            machine_reasons: [],
            user_safe_explanation: "Review recommended.",
            internal_notes: null,
            summary: "Needs manual review.",
            created_at: "2026-04-04T08:10:00Z",
          },
        },
      ],
    },
    {
      method: "GET",
      url: /\/api\/admin\/moderation\/issues\/issue-1$/,
      response: {
        issue_id: "issue-1",
        author: integritySummary,
        issue_status: "pending_moderation",
        moderation_state: "under_review",
        latest_result: {
          id: "mod-1",
          layer: "deterministic",
          status: "needs_review",
          decision_code: "tone_flagged",
          provider_name: null,
          model_name: null,
          machine_reasons: [],
          user_safe_explanation: "Review recommended.",
          internal_notes: null,
          summary: "Needs manual review.",
          created_at: "2026-04-04T08:10:00Z",
        },
        results: [
          {
            id: "mod-1",
            layer: "deterministic",
            status: "needs_review",
            decision_code: "tone_flagged",
            provider_name: null,
            model_name: null,
            machine_reasons: [],
            user_safe_explanation: "Review recommended.",
            internal_notes: "High emphasis",
            summary: "Needs manual review.",
            created_at: "2026-04-04T08:10:00Z",
            flags: { caps_ratio: 0.4 },
          },
        ],
      },
    },
    {
      method: "POST",
      url: /\/api\/admin\/moderation\/issues\/issue-1\/rerun$/,
      response: {
        issue_id: "issue-1",
        author: integritySummary,
        issue_status: "approved",
        moderation_state: "completed",
        latest_result: {
          id: "mod-2",
          layer: "llm",
          status: "approved",
          decision_code: "approve",
          provider_name: "openai",
          model_name: "gpt-5.4-mini",
          machine_reasons: [],
          user_safe_explanation: "The report is constructive and actionable.",
          internal_notes: null,
          summary: "Approved after rerun.",
          created_at: "2026-04-04T08:20:00Z",
        },
        results: [
          {
            id: "mod-2",
            layer: "llm",
            status: "approved",
            decision_code: "approve",
            provider_name: "openai",
            model_name: "gpt-5.4-mini",
            machine_reasons: [],
            user_safe_explanation: "The report is constructive and actionable.",
            internal_notes: null,
            summary: "Approved after rerun.",
            created_at: "2026-04-04T08:20:00Z",
            flags: {},
          },
        ],
      },
    },
    {
      method: "GET",
      url: /\/api\/admin\/users\?limit=40$/,
      response: [integritySummary],
    },
  ]);

  await page.goto("/en/admin/moderation");
  await expect(page.getByRole("heading", { name: "Inspect automated moderation decisions" })).toBeVisible();
  await page.getByRole("button", { name: "Rerun moderation" }).click();
  await expect(page.getByText("Feedback saved.")).toBeVisible();
});

test("admin can reply to a support ticket", async ({ page }) => {
  await seedSession(page, "admin-token");
  await mockApi(page, [
    {
      method: "GET",
      url: /\/api\/users\/me$/,
      response: adminUser,
    },
    {
      method: "GET",
      url: /\/api\/admin\/tickets\/ticket-1$/,
      response: {
        id: "ticket-1",
        issue_id: "issue-1",
        author: {
          ...citizenUser,
          last_login_at: null,
        },
        type: "appeal",
        status: "open",
        subject: "Please review my report again",
        issue_title: "Broken crossing lights",
        issue_status: "rejected",
        latest_moderation_code: "tone_flagged",
        messages: [
          {
            id: "msg-1",
            ticket_id: "ticket-1",
            author_id: citizenUser.id,
            body: "I rewrote the issue and want another review.",
            is_internal: false,
            created_at: "2026-04-04T08:00:00Z",
            updated_at: "2026-04-04T08:00:00Z",
          },
        ],
        created_at: "2026-04-04T08:00:00Z",
        updated_at: "2026-04-04T08:00:00Z",
      },
    },
    {
      method: "POST",
      url: /\/api\/admin\/tickets\/ticket-1\/reply$/,
      response: {
        id: "ticket-1",
        issue_id: "issue-1",
        author: {
          ...citizenUser,
          last_login_at: null,
        },
        type: "appeal",
        status: "under_review",
        subject: "Please review my report again",
        issue_title: "Broken crossing lights",
        issue_status: "rejected",
        latest_moderation_code: "tone_flagged",
        messages: [
          {
            id: "msg-1",
            ticket_id: "ticket-1",
            author_id: citizenUser.id,
            body: "I rewrote the issue and want another review.",
            is_internal: false,
            created_at: "2026-04-04T08:00:00Z",
            updated_at: "2026-04-04T08:00:00Z",
          },
          {
            id: "msg-2",
            ticket_id: "ticket-1",
            author_id: adminUser.id,
            body: "We reopened the appeal for review.",
            is_internal: false,
            created_at: "2026-04-04T08:15:00Z",
            updated_at: "2026-04-04T08:15:00Z",
          },
        ],
        created_at: "2026-04-04T08:00:00Z",
        updated_at: "2026-04-04T08:15:00Z",
      },
    },
  ]);

  await page.goto("/en/admin/tickets/ticket-1");
  await page.getByLabel("Reply").fill("We reopened the appeal for review.");
  await page.getByRole("button", { name: "Send reply" }).click();
  await expect(page.getByText("We reopened the appeal for review.")).toBeVisible();
});

test("admin can ban and unban a user", async ({ page }) => {
  await seedSession(page, "admin-token");
  await mockApi(page, [
    {
      method: "GET",
      url: /\/api\/users\/me$/,
      response: adminUser,
    },
    {
      method: "GET",
      url: /\/api\/admin\/users\/user-citizen$/,
      response: {
        identity: {
          ...citizenUser,
          last_login_at: "2026-04-04T08:00:00Z",
        },
        integrity: integritySummary,
        recent_events: [],
        trust_factors: [],
        abuse_factors: [],
        recommended_actions: ["Observe new submissions for two weeks"],
        metrics: {},
        recent_issues: [],
        recent_tickets: [],
        moderation_history: [],
        reaction_patterns: [],
      },
    },
    {
      method: "POST",
      url: /\/api\/admin\/users\/user-citizen\/ban$/,
      response: {
        identity: {
          ...citizenUser,
          is_active: false,
          last_login_at: "2026-04-04T08:00:00Z",
        },
        integrity: integritySummary,
        recent_events: [],
        trust_factors: [],
        abuse_factors: [],
        recommended_actions: ["Account suspended"],
        metrics: {},
        recent_issues: [],
        recent_tickets: [],
        moderation_history: [],
        reaction_patterns: [],
      },
    },
    {
      method: "POST",
      url: /\/api\/admin\/users\/user-citizen\/unban$/,
      response: {
        identity: {
          ...citizenUser,
          is_active: true,
          last_login_at: "2026-04-04T08:00:00Z",
        },
        integrity: integritySummary,
        recent_events: [],
        trust_factors: [],
        abuse_factors: [],
        recommended_actions: ["Continue monitoring"],
        metrics: {},
        recent_issues: [],
        recent_tickets: [],
        moderation_history: [],
        reaction_patterns: [],
      },
    },
  ]);

  await page.goto("/en/admin/users/user-citizen");
  await page.getByLabel("Action note").fill("Temporary suspension during review.");
  await page.getByRole("button", { name: "Ban user", exact: true }).click();
  await expect(page.getByText("Update saved.")).toBeVisible();
  await page.getByRole("button", { name: "Unban user", exact: true }).click();
  await expect(page.getByText("Continue monitoring")).toBeVisible();
});
