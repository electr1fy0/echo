import {
  IndianRupee,
  Calendar,
  FileUp,
  Image,
  BarChart3,
  MapPin,
  Route,
  Tag,
  MessageSquare,
  Minus,
  Plus,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { ALLOWED_FIELD_TYPES } from "@/types";
import type { SchemaField } from "@/types";
import {
  NumberField,
  NumberFieldDecrement,
  NumberFieldGroup,
  NumberFieldIncrement,
  NumberFieldInput,
} from "@/components/ui/number-field";

interface SchemaEditorProps {
  fields: SchemaField[];
  onChange: (fields: SchemaField[]) => void;
}

const FIELD_META: Record<string, { label: string; icon: any }> = {
  image: { label: "Image", icon: Image },
  poll: { label: "Poll", icon: BarChart3 },
  currency: { label: "Price", icon: IndianRupee },
  datetime: { label: "Date-Time", icon: Calendar },
  file: { label: "File", icon: FileUp },
  location: { label: "Location", icon: MapPin },
  source_destination: { label: "Source → Destination", icon: Route },
  key_value: { label: "Key:Value", icon: Tag },
  button: { label: "DM Button", icon: MessageSquare },
};



export function SchemaEditor({ fields, onChange }: SchemaEditorProps) {
  const getField = (type: SchemaField["type"]) =>
    fields.find((f) => f.type === type);

  const handleToggle = (type: SchemaField["type"], checked: boolean) => {
    const nextFields = [...fields];
    const index = nextFields.findIndex((f) => f.type === type);

    if (index !== -1) {
      nextFields.splice(index, 1);
    } else if (checked && ALLOWED_FIELD_TYPES.includes(type as any)) {
      nextFields.push({
        id: `standard_${type}`,
        type,
        label: FIELD_META[type]?.label || "Field",
        required: 0,
      });
    }

    onChange(nextFields);
  };

  const updateField = (type: SchemaField["type"], updates: Partial<SchemaField>) => {
    const nextFields = fields.map((f) =>
      f.type === type ? { ...f, ...updates } : f
    );
    onChange(nextFields);
  };

  return (
    <div className="space-y-3 pt-3 border-t border-neutral-100 dark:border-neutral-900/60">
      <span className="text-xs font-bold text-neutral-950 dark:text-white block mb-1">
        Configure Channel Fields
      </span>

      <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1 scrollbar-thin">
        {ALLOWED_FIELD_TYPES.map((type) => {
          const meta = FIELD_META[type];
          if (!meta) return null;
          const Icon = meta.icon;
          const field = getField(type);
          const active = !!field;

          return (
            <div
              key={type}
              className={cn(
                "border border-neutral-200 dark:border-neutral-800 rounded-xl transition-all duration-200",
                active
                  ? "bg-neutral-50/30 dark:bg-neutral-900/20"
                  : "bg-transparent hover:bg-neutral-50/20 dark:hover:bg-neutral-900/10",
              )}
            >
              <div className="flex items-center gap-3 p-3">
                <div
                  className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                  onClick={() => handleToggle(type, !active)}
                >
                  <Checkbox checked={active} readOnly />
                  <Icon
                    className={cn(
                      "size-4 shrink-0 transition-colors",
                      active
                        ? "text-neutral-800 dark:text-neutral-200"
                        : "text-neutral-400 dark:text-neutral-500",
                    )}
                  />
                  <span
                    className={cn(
                      "text-xs transition-colors truncate",
                      active
                        ? "text-neutral-900 dark:text-white"
                        : "text-neutral-400 dark:text-neutral-500",
                    )}
                  >
                    {meta.label}
                  </span>
                </div>
                {active && (
                  <div className="flex items-center shrink-0" onClick={(e) => e.stopPropagation()}>
                    <NumberField
                      value={field!.required}
                      onValueChange={(v, _evt) => {
                        if (v !== null) updateField(type, { required: Math.max(0, v) });
                      }}
                      min={0}
                      max={5}
                    >
                      <NumberFieldGroup className="h-7 w-28 rounded-lg border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none">
                        <NumberFieldDecrement className="size-7 rounded-s-lg border-e-neutral-200 dark:border-e-neutral-800 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800">
                          <Minus className="size-3" />
                        </NumberFieldDecrement>
                        <NumberFieldInput className="h-full px-0 text-[11px] text-neutral-700 dark:text-neutral-300" />
                        <NumberFieldIncrement className="size-7 rounded-e-lg border-s-neutral-200 dark:border-s-neutral-800 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800">
                          <Plus className="size-3" />
                        </NumberFieldIncrement>
                      </NumberFieldGroup>
                    </NumberField>
                    <span className="ml-1.5 text-[10px] text-neutral-400">req</span>
                  </div>
                )}
              </div>
              {active && type === "key_value" && field!.required > 0 && (
                <div className="px-3 pb-3 space-y-1.5" onClick={(e) => e.stopPropagation()}>
                  {Array.from({ length: field!.required }, (_, i) => {
                    const keys = field!.defaultKeys || [];
                    const val = keys[i] || "";
                    return (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-[10px] text-neutral-400 shrink-0 w-20">Key #{i + 1}:</span>
                        <input
                          type="text"
                          value={val}
                          onChange={(e) => {
                            const next = [...(field!.defaultKeys || [])];
                            next[i] = e.target.value;
                            updateField(type, { defaultKeys: next.every((v) => !v) ? undefined : next });
                          }}
                          placeholder="e.g. Color"
                          className="flex-1 h-7 px-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-[11px] text-neutral-800 dark:text-neutral-200 placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-[var(--brand)]/35"
                        />
                      </div>
                    );
                  })}
                </div>
              )}
              {active && type === "button" && field!.required > 0 && (
                <div className="px-3 pb-3 space-y-1.5" onClick={(e) => e.stopPropagation()}>
                  {Array.from({ length: field!.required }, (_, i) => {
                    const templates = field!.defaultTemplates || [];
                    const val = templates[i] || "I'm interested";
                    return (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-[10px] text-neutral-400 shrink-0 w-20">Msg #{i + 1}:</span>
                        <input
                          type="text"
                          value={val}
                          onChange={(e) => {
                            const next = [...(field!.defaultTemplates || [])];
                            next[i] = e.target.value;
                            updateField(type, { defaultTemplates: next.every((v) => !v) ? undefined : next });
                          }}
                          placeholder="e.g. Hey, check this out!"
                          className="flex-1 h-7 px-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-[11px] text-neutral-800 dark:text-neutral-200 placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-[var(--brand)]/35"
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(" ");
}
