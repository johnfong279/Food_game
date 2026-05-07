import type { AnalyticsEventName, AnalyticsEventType } from "@/schemas/analytics";

interface TrackAnalyticsOptions {
  sessionToken?: string | null;
  metadata?: Record<string, string | number | boolean | null>;
}

export function trackAnalyticsEvent(
  eventName: AnalyticsEventName,
  eventType: AnalyticsEventType,
  options: TrackAnalyticsOptions = {}
) {
  if (typeof window === "undefined") return;

  const body = JSON.stringify({
    eventName,
    eventType,
    sessionToken: options.sessionToken || undefined,
    metadata: options.metadata ?? {},
  });

  void fetch("/api/analytics/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => {
    // Analytics should never block gameplay.
  });
}
