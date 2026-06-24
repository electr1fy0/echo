import { Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

                <button
                  type="button"
                  onClick={() => onRemove(idx)}
                  className="p-1 text-neutral-400 hover:text-red-500 transition-colors cursor-pointer"
                >
                  <Trash2 className="size-3.5" />
                </button>
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

              <div className="flex items-center gap-4">
                <span
                  onClick={() => onUpdate(idx, { required: !field.required })}
                  className={`text-xs cursor-pointer select-none ${
                    field.required ? "text-[var(--brand)]" : "text-neutral-400"
                  }`}
                >
                  {field.required ? "Required" : "Optional"}
                </span>
                <span
                  onClick={() => onUpdate(idx, { disabled: !field.disabled })}
                  className={`text-xs cursor-pointer select-none ${
                    field.disabled ? "text-red-500" : "text-neutral-400"
                  }`}
                >
                  {field.disabled ? "Disabled" : "Active"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
