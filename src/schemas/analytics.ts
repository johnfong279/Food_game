import { z } from "zod";

export const AnalyticsEventNameSchema = z.enum([
  "landing_view",
  "game_view",
  "end_view",
  "claim_view",
  "leaderboard_view",
  "session_start_success",
  "game_completed",
  "score_submit_success",
  "email_submit_attempt",
  "email_submit_success",
  "email_submit_failed",
  "start_game_click",
  "view_leaderboard_click",
  "claim_snack_click",
  "terms_open_click",
  "terms_close_click",
  "get_my_snack_click",
  "copy_code_click",
  "leaderboard_after_claim_click",
  "external_snack_link_click",
]);

export const AnalyticsEventTypeSchema = z.enum([
  "button_click",
  "screen_view",
  "funnel",
]);

const AnalyticsMetadataValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.null(),
]);

export const AnalyticsTrackRequestSchema = z.object({
  eventName: AnalyticsEventNameSchema,
  eventType: AnalyticsEventTypeSchema,
  sessionToken: z.string().min(1).optional(),
  metadata: z.record(z.string(), AnalyticsMetadataValueSchema).optional().default({}),
});

export type AnalyticsEventName = z.infer<typeof AnalyticsEventNameSchema>;
export type AnalyticsEventType = z.infer<typeof AnalyticsEventTypeSchema>;
export type AnalyticsTrackRequest = z.infer<typeof AnalyticsTrackRequestSchema>;
