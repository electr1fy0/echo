import { describe, it, expect } from "vitest";
import { getLevel, getNextLevel, getLevelProgress } from "./level";

describe("getLevel", () => {
  it("returns Novice for reputation < 100", () => {
    const level = getLevel(0);
    expect(level.rank).toBe("Novice");
    expect(level.level).toBe(1);
  });

  it("returns Apprentice for reputation >= 100", () => {
    expect(getLevel(100).rank).toBe("Apprentice");
    expect(getLevel(499).rank).toBe("Apprentice");
  });

  it("returns Contributor for reputation >= 500", () => {
    expect(getLevel(500).rank).toBe("Contributor");
    expect(getLevel(1999).rank).toBe("Contributor");
  });

  it("returns Expert for reputation >= 2000", () => {
    expect(getLevel(2000).rank).toBe("Expert");
  });

  it("returns Master for reputation >= 5000", () => {
    expect(getLevel(5000).rank).toBe("Master");
  });

  it("returns Legend for reputation >= 10000", () => {
    expect(getLevel(10000).rank).toBe("Legend");
    expect(getLevel(99999).rank).toBe("Legend");
  });

  it("returns the highest level that the reputation qualifies for", () => {
    expect(getLevel(2500).rank).toBe("Expert");
  });
});

describe("getNextLevel", () => {
  it("returns Apprentice when at Novice", () => {
    const next = getNextLevel(0);
    expect(next?.rank).toBe("Apprentice");
    expect(next?.minRep).toBe(100);
  });

  it("returns Legend when at Master", () => {
    const next = getNextLevel(7500);
    expect(next?.rank).toBe("Legend");
    expect(next?.minRep).toBe(10000);
  });

  it("returns null when at max level", () => {
    expect(getNextLevel(10000)).toBeNull();
    expect(getNextLevel(99999)).toBeNull();
  });
});

describe("getLevelProgress", () => {
  it("returns progress between current and next level", () => {
    const progress = getLevelProgress(250);
    // reputation=250 => current=Apprentice(minRep=100), next=Contributor(minRep=500)
    expect(progress.current).toBe(100);
    expect(progress.next).toBe(500);
    expect(progress.progress).toBeCloseTo(0.375); // (250-100)/(500-100) = 150/400 = 0.375
  });

  it("returns 1 progress at max level", () => {
    const progress = getLevelProgress(50000);
    expect(progress.progress).toBe(1);
  });

  it("returns 0 progress at start of a level", () => {
    const progress = getLevelProgress(100);
    expect(progress.progress).toBe(0); // (100-100)/(500-100) = 0
  });
});
