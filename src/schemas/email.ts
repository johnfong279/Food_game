import { z } from "zod";

export const EmailSubmitRequestSchema = z.object({
  sessionToken: z.string().min(1),
  displayName: z.string().trim().min(1).max(16),
  email: z.string().email(),
  consent: z.literal(true),
  honeypot: z.string().max(0).optional(),
});

export const EmailSubmitResponseSchema = z.object({
  success: z.literal(true),
});

export type EmailSubmitRequest = z.infer<typeof EmailSubmitRequestSchema>;
