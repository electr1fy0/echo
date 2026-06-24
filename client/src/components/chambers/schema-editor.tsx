import { Trash2, HelpCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import type { SchemaField } from "@/types";

interface SchemaEditorProps {
  fields: SchemaField[];
  onAdd: () => void;
  onUpdate: (index: number, updates: Partial<SchemaField>) => void;
  onRemove: (index: number) => void;
}

const FIELD_TYPES = [
  { value: "text", label: "Text" },
  { value: "number", label: "Number" },
  { value: "currency", label: "Currency" },
  { value: "select", label: "Dropdown" },
  { value: "datetime", label: "Date-Time" },
  { value: "url", label: "Link" },
  { value: "file", label: "File" },
] as const;

export function SchemaEditor({ fields, onAdd, onUpdate, onRemove }: SchemaEditorProps) {
  return (
    <div className="space-y-4 pt-3 border-t border-neutral-100 dark:border-neutral-900">
      <div className="flex items-center justify-between">
        <span className="text-xs text-neutral-400">Custom Fields</span>
        <button
          type="button"
          onClick={onAdd}
          className="text-xs text-[var(--brand)] hover:text-[var(--brand-hover)] cursor-pointer"
        >
          Add Field
        </button>
      </div>

      {fields.length === 0 ? (
        <p className="text-xs text-neutral-400">
          No custom fields. This channel will use standard text discussions.
        </p>
      ) : (
        <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1 scrollbar-modern">
          {fields.map((field, idx) => (
            <div key={field.id} className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Field Label"
                  value={field.label}
                  onChange={(e) => onUpdate(idx, { label: e.target.value })}
                  className="flex-1 h-8 text-xs px-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-background outline-none"
                />
                <DropdownMenu>
                  <DropdownMenuTrigger className="h-8 text-xs px-2.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-background cursor-pointer min-w-[100px]">
                    {field.type === "currency" ? "Currency" : field.type === "datetime" ? "Date-Time" : field.type === "file" ? "File" : field.type.charAt(0).toUpperCase() + field.type.slice(1)}
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="min-w-[100px]">
                    {FIELD_TYPES.map((ft) => (
                      <DropdownMenuItem key={ft.value} onClick={() => onUpdate(idx, { type: ft.value as SchemaField["type"] })} className="text-xs cursor-pointer">
                        {ft.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <Tooltip>
                  <TooltipTrigger
                    render={
                      <button
                        type="button"
                        onClick={() => onRemove(idx)}
                        className="p-1 text-neutral-400 hover:text-red-500 transition-colors cursor-pointer"
                        aria-label="Delete field"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    }
                  />
                  <TooltipContent side="top">
                    Removes field completely. Warning: breaks rendering for existing posts using this field.
                  </TooltipContent>
                </Tooltip>
              </div>

              {field.type === "select" && (
                <input
                  type="text"
                  placeholder="Options (comma separated)"
                  value={field.options?.join(", ") || ""}
                  onChange={(e) =>
                    onUpdate(idx, {
                      options: e.target.value.split(",").map((o) => o.trim()),
                    })
                  }
                  className="h-7 text-xs px-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-background outline-none w-full"
                />
              )}

              <div className="flex items-center gap-6 pt-1">
                <div className="flex items-center gap-2">
                  <Switch
                    id={`required-${field.id}`}
                    size="sm"
                    checked={field.required}
                    onCheckedChange={(checked) => onUpdate(idx, { required: checked })}
                  />
                  <label
                    htmlFor={`required-${field.id}`}
                    className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400 cursor-pointer select-none"
                  >
                    Required
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    id={`disabled-${field.id}`}
                    size="sm"
                    checked={field.disabled === true}
                    onCheckedChange={(checked) => onUpdate(idx, { disabled: checked })}
                  />
                  <label
                    htmlFor={`disabled-${field.id}`}
                    className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400 cursor-pointer select-none"
                  >
                    Disable Field
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
                      Hides this field from new posts, but preserves older posts' data.
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
