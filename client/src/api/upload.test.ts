import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/compress-image", () => ({
  compressImage: vi.fn(async (file: File) => file),
}));

vi.mock("@/lib/utils", () => ({
  getAuthHeaders: () => ({ Authorization: "Bearer test" }),
}));

vi.mock("@/lib/api-error", () => ({
  parseApiError: vi.fn(async () => {
    throw new Error("api error");
  }),
}));

import { uploadImagePresigned } from "./upload";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("uploadImagePresigned", () => {
  it("uses the presigned path and sends the signed content type", async () => {
    const file = new File(["hello"], "photo.png", { type: "image/png" });
    const fetchSpy = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(JSON.stringify({
        url: "https://r2.example/upload",
        publicUrl: "https://app.example/images/uploads/photo.png",
      }), { status: 200, headers: { "content-type": "application/json" } }))
      .mockResolvedValueOnce(new Response(null, { status: 200 }));

    const result = await uploadImagePresigned(file);

    expect(result).toBe("https://app.example/images/uploads/photo.png");
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    const presignInit = fetchSpy.mock.calls[0][1] as RequestInit;
    expect(JSON.parse(String(presignInit.body))).toEqual({
      filename: "photo.png",
      contentType: "image/png",
    });
    const putInit = fetchSpy.mock.calls[1][1] as RequestInit;
    expect(putInit.method).toBe("PUT");
    expect(putInit.headers).toEqual({ "Content-Type": "image/png" });
    expect(putInit.body).toBe(file);
  });

  it("falls back to the direct upload when presigning fails", async () => {
    const file = new File(["hello"], "photo.png", { type: "image/png" });
    const fetchSpy = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response("nope", { status: 500 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ url: "https://app.example/images/direct.png" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }));

    const result = await uploadImagePresigned(file);

    expect(result).toBe("https://app.example/images/direct.png");
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    const fallbackInit = fetchSpy.mock.calls[1][1] as RequestInit;
    expect(fallbackInit.method).toBe("POST");
    expect(fallbackInit.body).toBeInstanceOf(FormData);
  });

  it("falls back to the direct upload when the R2 PUT fails", async () => {
    const file = new File(["hello"], "photo.png", { type: "image/png" });
    const fetchSpy = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(JSON.stringify({
        url: "https://r2.example/upload",
        publicUrl: "https://app.example/images/uploads/photo.png",
      }), { status: 200, headers: { "content-type": "application/json" } }))
      .mockResolvedValueOnce(new Response("failed", { status: 403 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ url: "https://app.example/images/direct.png" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }));

    const result = await uploadImagePresigned(file);

    expect(result).toBe("https://app.example/images/direct.png");
    expect(fetchSpy).toHaveBeenCalledTimes(3);
  });
});
