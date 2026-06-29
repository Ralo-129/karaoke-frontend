import { describe, it, expect, vi, beforeEach } from "vitest";

// normalizeUrl reads BACKEND_URL from the module scope at import time, so we
// need to set the env var before importing.
describe("normalizeUrl", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("returns the URL as-is when it starts with http", async () => {
    process.env.BACKEND_URL = "https://api.example.com";
    const { normalizeUrl } = await import("../../app/lib/catalog");
    expect(normalizeUrl("https://cdn.example.com/file.mp4")).toBe("https://cdn.example.com/file.mp4");
  });

  it("prepends BACKEND_URL to relative paths", async () => {
    process.env.BACKEND_URL = "https://api.example.com";
    const { normalizeUrl } = await import("../../app/lib/catalog");
    expect(normalizeUrl("/uploads/song.mp4")).toBe("https://api.example.com/uploads/song.mp4");
  });

  it("returns undefined for empty string", async () => {
    const { normalizeUrl } = await import("../../app/lib/catalog");
    expect(normalizeUrl("")).toBeUndefined();
  });

  it("returns undefined for non-string values", async () => {
    const { normalizeUrl } = await import("../../app/lib/catalog");
    expect(normalizeUrl(null)).toBeUndefined();
    expect(normalizeUrl(42)).toBeUndefined();
    expect(normalizeUrl(undefined)).toBeUndefined();
  });
});
