import { z } from "zod";

export const LeaderboardEntrySchema = z.object({
  rank: z.number().int().positive(),
  name: z.string(),
  score: z.number().int().nonnegative(),
  createdAt: z.string(),
});

export const LeaderboardResponseSchema = z.object({
  top10: z.array(LeaderboardEntrySchema),
  yourRank: z.number().int().positive().nullable(),
  yourEntry: LeaderboardEntrySchema.nullable(),
});

export type LeaderboardEntry = z.infer<typeof LeaderboardEntrySchema>;
export type LeaderboardResponse = z.infer<typeof LeaderboardResponseSchema>;
