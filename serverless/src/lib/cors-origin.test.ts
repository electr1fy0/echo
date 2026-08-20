import { describe, expect, it } from "vitest";
import { getAllowedCorsOrigins, resolveCorsOrigin } from "./cors-origin";

describe("CORS origin policy", () => {
  it("allows the local development origins", () => {
    expect(resolveCorsOrigin("http://localhost:5173")).toBe("http://localhost:5173");
    expect(resolveCorsOrigin("http://127.0.0.1:5173")).toBe("http://127.0.0.1:5173");
  });

  it("allows configured production origins", () => {
    expect(resolveCorsOrigin("https://turnsout.xyz", "https://turnsout.xyz")).toBe("https://turnsout.xyz");
  });

  it("supports a comma-separated allowlist", () => {
    const allowed = getAllowedCorsOrigins("https://turnsout.xyz, https://www.turnsout.xyz");
    expect(allowed.has("https://turnsout.xyz")).toBe(true);
    expect(allowed.has("https://www.turnsout.xyz")).toBe(true);
  });

  it("does not reflect arbitrary origins", () => {
    expect(resolveCorsOrigin("https://evil.example", "https://turnsout.xyz")).toBe("");
  });

  it("does not treat wildcard as permission to reflect a credentialed origin", () => {
    expect(resolveCorsOrigin("https://evil.example", "*")).toBe("");
  });
});
