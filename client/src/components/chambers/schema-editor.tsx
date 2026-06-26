import { 
  IndianRupee, 
  Calendar, 
  FileUp, 
  Image, 
  BarChart3,
  MapPin,
  Route,
  Tag,
  MessageSquare
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { ALLOWED_FIELD_TYPES } from "@/types";
import type { SchemaField } from "@/types";

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
  const isActive = (type: SchemaField["type"]) =>
    fields.some((f) => f.type === type);

  const isRequired = (type: SchemaField["type"]) =>
    fields.some((f) => f.type === type && f.required);

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
        required: false,
      });
    }

    onChange(nextFields);
  };

  const handleRequiredToggle = (type: SchemaField["type"], required: boolean) => {
    const nextFields = fields.map((f) =>
      f.type === type ? { ...f, required } : f
    );
    onChange(nextFields);
  };

  return (
    <div className="space-y-3 pt-3 border-t border-neutral-100 dark:border-neutral-900/60">
      <span className="text-xs font-bold text-neutral-950 dark:text-white block mb-1">
        Configure Channel Fields
      </span>

      <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
        {ALLOWED_FIELD_TYPES.map((type) => {
          const meta = FIELD_META[type];
          if (!meta) return null;
          const Icon = meta.icon;
          const active = isActive(type);
          const required = isRequired(type);

          return (
            <div
              key={type}
              className="flex items-center gap-3 p-3 border border-neutral-200 dark:border-neutral-800 rounded-xl transition-all duration-200 bg-transparent hover:bg-neutral-50/20 dark:hover:bg-neutral-900/10"
            >
              <div
                className="flex items-center gap-3 flex-1 cursor-pointer"
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
                <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                  <span className="text-[10px] text-neutral-400">Required</span>
                  <Switch
                    checked={required}
                    onCheckedChange={(checked) => handleRequiredToggle(type, checked)}
                  />
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
