import { useState, useEffect, useCallback } from "react";

export type AccentTheme =
  | "orange"
  | "blue"
  | "violet"
  | "rose"
  | "green"
  | "cyan"
  | "pink"
  | "red"
  | "lime";

const STORAGE_KEY = "turnsout_accent";

const THEMES: Record<AccentTheme, { label: string; color: string }> = {
  orange: { label: "Orange", color: "#ff5a1f" },
  blue: { label: "Blue", color: "#3b82f6" },
  violet: { label: "Violet", color: "#8b5cf6" },
  rose: { label: "Rose", color: "#f43f5e" },
  green: { label: "Green", color: "#22c55e" },
  cyan: { label: "Cyan", color: "#06b6d4" },
  pink: { label: "Pink", color: "#ec4899" },
  red: { label: "Red", color: "#ef4444" },
  lime: { label: "Lime", color: "#84cc16" },
};

function getStored(): AccentTheme {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v && v in THEMES) return v as AccentTheme;
  } catch {}
  return "orange";
}

export function useAccentTheme() {
  const [accent, setAccentState] = useState<AccentTheme>(getStored);

  useEffect(() => {
    document.documentElement.setAttribute("data-accent", accent);
    try {
      localStorage.setItem(STORAGE_KEY, accent);
    } catch {}
  }, [accent]);

  const setAccent = useCallback((a: AccentTheme) => setAccentState(a), []);

  return { accent, setAccent, themes: THEMES };
}
