import { describe, expect, it } from "vitest";
import { isSafeExternalHttpUrl } from "./url-safety";

describe("isSafeExternalHttpUrl", () => {
  it("accepts ordinary public http and https URLs", () => {
    expect(isSafeExternalHttpUrl("https://example.com/path?q=1")).toBe(true);
    expect(isSafeExternalHttpUrl("http://example.com")).toBe(true);
  });

  it("rejects non-http protocols", () => {
    expect(isSafeExternalHttpUrl("file:///etc/passwd")).toBe(false);
    expect(isSafeExternalHttpUrl("ftp://example.com/file")).toBe(false);
    expect(isSafeExternalHttpUrl("javascript:alert(1)")).toBe(false);
  });

  it("rejects localhost and loopback addresses", () => {
    expect(isSafeExternalHttpUrl("http://localhost:8787")).toBe(false);
    expect(isSafeExternalHttpUrl("http://api.localhost/test")).toBe(false);
    expect(isSafeExternalHttpUrl("http://127.0.0.1")).toBe(false);
    expect(isSafeExternalHttpUrl("http://[::1]/")).toBe(false);
  });

  it("rejects private, link-local, CGNAT, and metadata-style IPv4 addresses", () => {
    const blocked = [
      "http://10.0.0.1",
      "http://172.16.0.1",
      "http://172.31.255.255",
      "http://192.168.1.1",
      "http://169.254.169.254/latest/meta-data",
      "http://100.64.0.1",
      "http://198.18.0.1",
      "http://0.0.0.0",
    ];

    for (const url of blocked) {
      expect(isSafeExternalHttpUrl(url), url).toBe(false);
    }
  });

  it("rejects private IPv6 ranges", () => {
    expect(isSafeExternalHttpUrl("http://[fc00::1]/")).toBe(false);
    expect(isSafeExternalHttpUrl("http://[fd12:3456::1]/")).toBe(false);
    expect(isSafeExternalHttpUrl("http://[fe80::1]/")).toBe(false);
  });

  it("rejects credentials embedded in a URL", () => {
    expect(isSafeExternalHttpUrl("https://user:pass@example.com")).toBe(false);
  });

  it("rejects malformed URLs", () => {
    expect(isSafeExternalHttpUrl("not a url")).toBe(false);
  });
});
