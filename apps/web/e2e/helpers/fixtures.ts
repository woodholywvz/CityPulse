export const category = {
  id: "cat-road",
  slug: "road-safety",
  display_name: "Road safety",
  description: "Unsafe roads and street conditions",
  is_active: true,
  severity_baseline: 7,
  affected_people_baseline: 120,
};

export const citizenUser = {
  id: "user-citizen",
  email: "citizen@example.com",
  full_name: "Amina Sarsen",
  role: "citizen" as const,
  preferred_locale: "en",
  is_active: true,
  created_at: "2026-04-01T09:00:00Z",
  updated_at: "2026-04-01T09:00:00Z",
};

export const adminUser = {
  id: "user-admin",
  email: "admin@example.com",
  full_name: "Dana Operator",
  role: "admin" as const,
  preferred_locale: "en",
  is_active: true,
  created_at: "2026-03-01T09:00:00Z",
  updated_at: "2026-03-01T09:00:00Z",
};

export const publicIssue = {
  id: "issue-1",
  title: "Broken pedestrian crossing lights",
  short_description:
    "The crossing lights on Abay Avenue have not been working for two evenings, forcing residents to cross unsafely.",
  latitude: 43.2389,
  longitude: 76.8897,
  category,
  location_snippet: "Abay Avenue, central district",
  support_count: 37,
  public_impact_score: 8.4,
  affected_people_estimate: 180,
  importance_label: "Elevated civic priority",
  cover_image_url: null,
  created_at: "2026-04-02T11:00:00Z",
  updated_at: "2026-04-03T12:00:00Z",
  distance_km: 1.2,
};

export const publicIssueDetail = {
  ...publicIssue,
  source_locale: "en",
  attachments: [],
};

export const duplicateResponse = {
  status: "high_confidence_duplicate" as const,
  matches: [
    {
      existing_issue_id: publicIssue.id,
      similarity_score: 0.94,
      reason_breakdown: [
        "High text similarity",
        "Same category",
        "Nearby location",
      ],
      distance_km: 0.3,
      text_similarity: 0.92,
      category_match: true,
      recommended_action: "support_existing" as const,
      issue: publicIssue,
    },
  ],
};

export const rewriteResponse = {
  rewritten_title: "Pedestrian crossing lights are not functioning",
  rewritten_description:
    "The pedestrian crossing lights on Abay Avenue have been inactive for two evenings. Residents are crossing without a functioning signal, which creates a safety risk during busy traffic periods.",
  explanation: "The text was made more neutral, specific, and easier to route.",
  tone_classification: "frustrated but constructive",
};
