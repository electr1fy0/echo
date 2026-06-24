export const LEVEL_THRESHOLDS = [
  { level: 1, minRep: 0, rank: "Novice", label: "Bronze", gradient: "from-amber-700 to-amber-500", border: "amber-400/30", glow: "rgba(217,119,6,0.3)" },
  { level: 2, minRep: 100, rank: "Apprentice", label: "Silver", gradient: "from-slate-500 to-slate-300", border: "slate-300/30", glow: "rgba(148,163,184,0.3)" },
  { level: 3, minRep: 500, rank: "Contributor", label: "Gold", gradient: "from-yellow-600 to-yellow-400", border: "yellow-400/30", glow: "rgba(234,179,8,0.3)" },
  { level: 4, minRep: 2000, rank: "Expert", label: "Emerald", gradient: "from-emerald-600 to-emerald-400", border: "emerald-400/30", glow: "rgba(52,211,153,0.3)" },
  { level: 5, minRep: 5000, rank: "Master", label: "Ruby", gradient: "from-red-600 to-red-400", border: "red-400/30", glow: "rgba(248,113,113,0.3)" },
  { level: 6, minRep: 10000, rank: "Legend", label: "Diamond", gradient: "from-violet-600 to-violet-400", border: "violet-400/30", glow: "rgba(167,139,250,0.3)" },
] as const;

export function getLevel(reputation: number): (typeof LEVEL_THRESHOLDS)[number] {
  let current: (typeof LEVEL_THRESHOLDS)[number] = LEVEL_THRESHOLDS[0];
  for (const threshold of LEVEL_THRESHOLDS) {
    if (reputation >= threshold.minRep) {
      current = threshold;
    }
  }
  return current;
}

export function getNextLevel(reputation: number): (typeof LEVEL_THRESHOLDS)[number] | null {
  for (const threshold of LEVEL_THRESHOLDS) {
    if (reputation < threshold.minRep) {
      return threshold;
    }
  }
  return null;
}

export function getLevelProgress(reputation: number): { current: number; next: number; progress: number } {
  const current = getLevel(reputation);
  const next = getNextLevel(reputation);
  if (!next) return { current: current.minRep, next: current.minRep, progress: 1 };
  const range = next.minRep - current.minRep;
  const progress = range > 0 ? (reputation - current.minRep) / range : 1;
  return { current: current.minRep, next: next.minRep, progress: Math.min(progress, 1) };
}
