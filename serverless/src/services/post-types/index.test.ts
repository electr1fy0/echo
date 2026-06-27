import { describe, it, expect } from "vitest";
import { getHandler, registry } from "./index";

describe("postType registry", () => {
  it("should return qna handler by default", () => {
    const handler = getHandler("unknown-type");
    expect(handler.type).toBe("qna");
  });

  it("should return correct handler for each type", () => {
    expect(getHandler("qna").type).toBe("qna");
    expect(getHandler("partner").type).toBe("partner");
    expect(getHandler("trade").type).toBe("trade");
    expect(getHandler("taxi").type).toBe("taxi");
    expect(getHandler("poll").type).toBe("poll");
  });

  it("qna handler should provide create values", () => {
    const handler = getHandler("qna");
    const values = handler.getCreateValues({ acceptsAnswers: true }, new Date());
    expect(values.postType).toBe("qna");
    expect(values.acceptsAnswers).toBe(true);
  });

  it("partner handler should set open status on create", () => {
    const handler = getHandler("partner");
    const values = handler.getCreateValues({ partnerTargetGrade: "A" }, new Date());
    expect(values.postType).toBe("partner");
    expect(values.partnerStatus).toBe("open");
    expect(values.partnerTargetGrade).toBe("A");
  });

  it("trade handler should set available status on create", () => {
    const handler = getHandler("trade");
    const values = handler.getCreateValues({ tradePrice: 100 }, new Date());
    expect(values.tradeStatus).toBe("available");
  });

  it("taxi handler should set open status on create", () => {
    const handler = getHandler("taxi");
    const values = handler.getCreateValues({ taxiDeparture: "Campus" }, new Date());
    expect(values.taxiStatus).toBe("open");
  });

  it("poll handler should provide update values", () => {
    const handler = getHandler("poll");
    const values = handler.getUpdateValues({});
    expect(Object.keys(values)).toHaveLength(0);
  });
});
