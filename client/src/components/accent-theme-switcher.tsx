import { useAccentTheme, type AccentTheme } from "@/hooks/use-accent-theme";
import { Popover, PopoverTrigger, PopoverPopup } from "@/components/ui/popover";

const THEME_LIST: AccentTheme[] = [
  "orange",
  "blue",
  "violet",
  "rose",
  "green",
  "cyan",
  "pink",
  "red",
  "lime",
];

export function AccentThemeSwitcher() {
  const { accent, setAccent, themes } = useAccentTheme();

  return (
    <Popover>
      <PopoverTrigger
        render={
          <button
            className="size-8 rounded-xl flex items-center justify-center hover:bg-neutral-100 dark:hover:bg-neutral-800/50 transition-colors cursor-pointer"
            title="Accent color"
            aria-label="Change accent color"
          >
            <span
              className="size-4 rounded-full border-2 border-neutral-200 dark:border-neutral-700"
              style={{ backgroundColor: themes[accent].color }}
            />
          </button>
        }
      />
      <PopoverPopup side="right" align="center" className="w-auto p-2">
        <div className="flex flex-col gap-1">
          {THEME_LIST.map((t) => (
            <button
              key={t}
              onClick={() => setAccent(t)}
              className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                accent === t
                  ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                  : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-900"
              }`}
            >
              <span
                className="size-3.5 rounded-full shrink-0"
                style={{ backgroundColor: themes[t].color }}
              />
              {themes[t].label}
            </button>
          ))}
        </div>
      </PopoverPopup>
    </Popover>
  );
}
