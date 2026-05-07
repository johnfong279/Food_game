import { describe, expect, it } from "vitest";
import { GET } from "../../src/app/api/admin/dashboard/route";

describe("admin dashboard API", () => {
  it("rejects unauthenticated requests", async () => {
    const response = await GET(new Request("http://localhost/api/admin/dashboard"));

    expect(response.status).toBe(401);
    expect(response.headers.get("www-authenticate")).toBe('Basic realm="Admin"');
  });
});
