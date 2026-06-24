import { 
  Trash2, 
  HelpCircle,
  Type, 
  Hash, 
  DollarSign, 
  List, 
  Calendar, 
  Link, 
  FileUp, 
  Image, 
  BarChart3
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import type { SchemaField } from "@/types";

interface SchemaEditorProps {
  fields: SchemaField[];
  onAdd: (type: SchemaField["type"]) => void;
  onUpdate: (index: number, updates: Partial<SchemaField>) => void;
  onRemove: (index: number) => void;
}

const FIELD_TYPES = [
  { value: "text", label: "Text", icon: Type, color: "text-blue-500 bg-blue-500/10" },
  { value: "number", label: "Number", icon: Hash, color: "text-amber-500 bg-amber-500/10" },
  { value: "currency", label: "Currency", icon: DollarSign, color: "text-emerald-500 bg-emerald-500/10" },
  { value: "select", label: "Dropdown", icon: List, color: "text-indigo-500 bg-indigo-500/10" },
  { value: "datetime", label: "Date-Time", icon: Calendar, color: "text-rose-500 bg-rose-500/10" },
  { value: "url", label: "Link", icon: Link, color: "text-sky-500 bg-sky-500/10" },
  { value: "file", label: "File", icon: FileUp, color: "text-teal-500 bg-teal-500/10" },
  { value: "image", label: "Image", icon: Image, color: "text-purple-500 bg-purple-500/10" },
  { value: "poll", label: "Poll", icon: BarChart3, color: "text-orange-500 bg-orange-500/10" },
] as const;

export function SchemaEditor({ fields, onAdd, onUpdate, onRemove }: SchemaEditorProps) {
  return (
    <div className="space-y-4 pt-3 border-t border-neutral-100 dark:border-neutral-900">
      <div className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
          Form Field Template & Restrictions
        </span>
        <span className="text-[11px] text-neutral-400 dark:text-neutral-500 leading-normal">
          By default, posts support all field types. Add fields here to mandate (require) them, or hide (restrict) them in this channel.
        </span>
      </div>

      {/* Grid of quick add buttons */}
      <div className="grid grid-cols-3 gap-2">
        {FIELD_TYPES.map((ft) => {
          const Icon = ft.icon;
          return (
            <button
              key={ft.value}
              type="button"
              onClick={() => onAdd(ft.value)}
              className="flex flex-col items-center gap-1.5 p-2 rounded-xl border border-neutral-200 dark:border-neutral-800/80 bg-neutral-50/20 hover:bg-neutral-100/50 dark:bg-neutral-950/10 dark:hover:bg-neutral-900/40 transition-all text-center cursor-pointer select-none active:scale-[0.98] group"
            >
              <div className={`p-1.5 rounded-lg transition-transform group-hover:scale-110 ${ft.color}`}>
                <Icon className="size-3.5" />
              </div>
              <span className="text-[10px] font-semibold text-neutral-600 dark:text-neutral-300">
                {ft.label}
              </span>
            </button>
          );
        })}
      </div>

      <div className="border-t border-neutral-100 dark:border-neutral-900/60 pt-3">
        <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 block mb-2">
          Configured Rules / Custom Fields ({fields.length})
        </span>

        {fields.length === 0 ? (
          <div className="text-center py-6 px-4 border border-dashed border-neutral-200 dark:border-neutral-800/80 rounded-2xl bg-neutral-50/10 dark:bg-neutral-950/5">
            <span className="text-xs text-neutral-400 dark:text-neutral-500 leading-normal block">
              No specific rules. Post creators can optionally use any of the standard fields (images, polls, files, etc.).
            </span>
          </div>
        ) : (
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
            {fields.map((field, idx) => {
              const typeDef = FIELD_TYPES.find((f) => f.value === field.type);
              const FieldIcon = typeDef?.icon || Type;
              const fieldColor = typeDef?.color || "text-neutral-500 bg-neutral-100";

              return (
                <div 
                  key={field.id} 
                  className="p-3 border border-neutral-200 dark:border-neutral-800/80 rounded-2xl bg-neutral-50/20 dark:bg-neutral-900/5 hover:border-neutral-300 dark:hover:border-neutral-700/80 transition-colors space-y-2.5"
                >
                  <div className="flex items-center gap-2.5">
                    {/* Icon & Type Indicator */}
                    <div className={`p-1.5 rounded-lg shrink-0 ${fieldColor}`}>
                      <FieldIcon className="size-3.5" />
                    </div>

                    {/* Field label input */}
                    <input
                      type="text"
                      placeholder="Field Label (e.g. Serial Number)"
                      value={field.label}
                      onChange={(e) => onUpdate(idx, { label: e.target.value })}
                      className="flex-1 h-8 text-xs font-semibold px-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800/80 bg-background hover:bg-neutral-50/40 dark:hover:bg-neutral-900/20 focus:bg-background focus:outline-none focus:ring-1 focus:ring-[var(--brand)]/35 text-neutral-800 dark:text-neutral-200"
                    />

                    {/* Delete button */}
                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <button
                            type="button"
                            onClick={() => onRemove(idx)}
                            className="size-8 flex items-center justify-center rounded-xl text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all cursor-pointer shrink-0"
                            aria-label="Delete field"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        }
                      />
                      <TooltipContent side="top">
                        Removes this rule completely.
                      </TooltipContent>
                    </Tooltip>
                  </div>

                  {/* Dropdown Options */}
                  {field.type === "select" && (
                    <div className="space-y-1 pl-1">
                      <span className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider block">
                        Dropdown Options
                      </span>
                      <input
                        type="text"
                        placeholder="Option 1, Option 2, Option 3 (comma separated)"
                        value={field.options?.join(", ") || ""}
                        onChange={(e) =>
                          onUpdate(idx, {
                            options: e.target.value.split(",").map((o) => o.trim()),
                          })
                        }
                        className="h-8 text-xs px-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-background outline-none w-full text-neutral-800 dark:text-neutral-200"
                      />
                    </div>
                  )}

                  {/* Mandate & Restrict switches */}
                  <div className="flex items-center gap-6 pl-1 pt-0.5">
                    {/* Mandate Field */}
                    <div className="flex items-center gap-2">
                      <Switch
                        id={`required-${field.id}`}
                        size="sm"
                        checked={field.required}
                        onCheckedChange={(checked) => {
                          const updates: Partial<SchemaField> = { required: checked };
                          // If mandated, it cannot be restricted
                          if (checked) updates.disabled = false;
                          onUpdate(idx, updates);
                        }}
                      />
                      <label
                        htmlFor={`required-${field.id}`}
                        className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 cursor-pointer select-none"
                      >
                        Mandate Field (Required)
                      </label>
                    </div>

                    {/* Restrict Field */}
                    <div className="flex items-center gap-2">
                      <Switch
                        id={`disabled-${field.id}`}
                        size="sm"
                        checked={field.disabled === true}
                        onCheckedChange={(checked) => {
                          const updates: Partial<SchemaField> = { disabled: checked };
                          // If restricted, it cannot be mandated
                          if (checked) updates.required = false;
                          onUpdate(idx, updates);
                        }}
                      />
                      <label
                        htmlFor={`disabled-${field.id}`}
                        className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 cursor-pointer select-none"
                      >
                        Restrict Field (Hidden)
                      </label>
                      <Tooltip>
                        <TooltipTrigger
                          render={
                            <button
                              type="button"
                              className="cursor-help text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 flex items-center"
                              aria-label="Disable field info"
                            >
                              <HelpCircle className="size-3.5" />
                            </button>
                          }
                        />
                        <TooltipContent side="top">
                          Hides this field, preventing users from adding it to posts in this channel.
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
