import { beforeEach, describe, expect, it, vi } from "vitest";

const insertMock = vi.fn();

vi.mock("../../src/lib/supabase/server", () => ({
  createServerClient: () => ({
    from: (table: string) => {
      if (table !== "analytics_events") {
        throw new Error(`Unexpected table ${table}`);
      }
      return {
        insert: insertMock,
      };
    },
  }),
}));

describe("snack redirect API", () => {
  beforeEach(() => {
    insertMock.mockResolvedValue({ error: null });
  });

  it("records the external snack click server-side before redirecting", async () => {
    const { GET } = await import("../../src/app/api/snack/redirect/route");
    const response = await GET(new Request("http://localhost/api/snack/redirect"));

    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe("https://applewood-signature.com/");
    expect(insertMock).toHaveBeenCalledWith({
      session_id: null,
      event_name: "external_snack_link_click",
      event_type: "button_click",
      metadata: { destination: "https://applewood-signature.com/" },
    });
  });
});
