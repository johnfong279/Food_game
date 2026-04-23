import { z } from "zod";

export const SessionStartResponseSchema = z.object({
  sessionToken: z.string(),
  serverTime: z.number(),
});

export type SessionStartResponse = z.infer<typeof SessionStartResponseSchema>;
