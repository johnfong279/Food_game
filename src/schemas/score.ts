import { z } from "zod";

export const GameEventSchema = z.object({
  type: z.enum(["petal_catch", "snack_catch", "miss"]),
  timestamp: z.number().int().positive(),
});

export const ScoreSubmitRequestSchema = z.object({
  sessionToken: z.string().min(1),
  score: z.number().int().nonnegative(),
  petalsCaught: z.number().int().nonnegative(),
  snacksCaught: z.number().int().nonnegative(),
  durationMs: z.number().int().positive(),
  events: z.array(GameEventSchema).max(2000),
});

export const ScoreSubmitResponseSchema = z.object({
  rank: z.number().int().positive(),
  totalPlayers: z.number().int().nonnegative(),
  discountCode: z.string(),
});

export type ScoreSubmitRequest = z.infer<typeof ScoreSubmitRequestSchema>;
export type ScoreSubmitResponse = z.infer<typeof ScoreSubmitResponseSchema>;
