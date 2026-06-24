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
import { Switch } from "@/components/ui/switch";
import type { SchemaField } from "@/types";

interface SchemaEditorProps {
  fields: SchemaField[];
  onChange: (fields: SchemaField[]) => void;
}

const STANDARD_FIELDS = [
  { type: "image" as const, label: "Image", icon: Image },
  { type: "poll" as const, label: "Poll", icon: BarChart3 },
  { type: "currency" as const, label: "Price", icon: IndianRupee },
  { type: "datetime" as const, label: "Date-Time", icon: Calendar },
  { type: "file" as const, label: "File", icon: FileUp },
  { type: "location" as const, label: "Location", icon: MapPin },
  { type: "source_destination" as const, label: "Source → Destination", icon: Route },
  { type: "key_value" as const, label: "Key:Value", icon: Tag },
  { type: "button" as const, label: "DM Button", icon: MessageSquare },
];

export function SchemaEditor({ fields, onChange }: SchemaEditorProps) {
  const getFieldState = (type: SchemaField["type"]) => {
    const existing = fields.find((f) => f.type === type);
    return {
      required: existing?.required || false,
      disabled: existing?.disabled || false,
    };
  };

  const handleToggle = (type: SchemaField["type"], toggleType: "required" | "disabled", checked: boolean) => {
    const defaultLabels: Record<string, string> = {
      currency: "Price",
      datetime: "Date-Time",
      file: "File",
      image: "Image Photo",
      poll: "Poll",
      location: "Location",
      source_destination: "Source → Destination",
      key_value: "Key:Value",
      button: "DM Button"
    };

    const nextFields = [...fields];
    const index = nextFields.findIndex((f) => f.type === type);

    if (index !== -1) {
      const field = { ...nextFields[index] };
      if (toggleType === "required") {
        field.required = checked;
        if (checked) field.disabled = false;
      } else {
        field.disabled = checked;
        if (checked) field.required = false;
      }

      if (!field.required && !field.disabled) {
        nextFields.splice(index, 1);
      } else {
        nextFields[index] = field;
      }
    } else if (checked) {
      nextFields.push({
        id: `standard_${type}`,
        type,
        label: defaultLabels[type] || "Field",
        required: toggleType === "required",
        disabled: toggleType === "disabled",
      });
    }

    onChange(nextFields);
  };

  return (
    <div className="space-y-3 pt-3 border-t border-neutral-100 dark:border-neutral-900/60">
      <span className="text-xs font-bold text-neutral-950 dark:text-white block mb-1">
        Configure Channel Fields
      </span>

      {/* Column Titles Header */}
      <div className="grid grid-cols-[1fr_80px_80px] items-center gap-4 px-3 text-[10px] font-bold text-neutral-450 dark:text-neutral-400 tracking-wider pb-0.5">
        <span />
        <span className="text-center">Required</span>
        <span className="text-center">Disabled</span>
      </div>

      <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
        {STANDARD_FIELDS.map((sf) => {
          const Icon = sf.icon;
          const { required, disabled } = getFieldState(sf.type);
          const isActive = required || disabled;

          return (
            <div 
              key={sf.type}
              className="p-3 border border-neutral-200 dark:border-neutral-800 rounded-2xl grid grid-cols-[1fr_80px_80px] items-center gap-4 transition-all duration-200 bg-transparent hover:bg-neutral-50/20 dark:hover:bg-neutral-900/10"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon className={cn("size-4 shrink-0 transition-colors", isActive ? "text-neutral-800 dark:text-neutral-200" : "text-neutral-400 dark:text-neutral-500")} />
                <span className={cn("text-xs transition-colors truncate", isActive ? "font-bold text-neutral-900 dark:text-white" : "font-semibold text-neutral-400 dark:text-neutral-500")}>
                  {sf.label}
                </span>
              </div>

              <div className="flex justify-center">
                <Switch
                  id={`req-${sf.type}`}
                  size="sm"
                  checked={required}
                  onCheckedChange={(checked) => handleToggle(sf.type, "required", checked)}
                />
              </div>

              <div className="flex justify-center">
                <Switch
                  id={`dis-${sf.type}`}
                  size="sm"
                  checked={disabled}
                  onCheckedChange={(checked) => handleToggle(sf.type, "disabled", checked)}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Simple CN helper since it is used inline
function cn(...classes: any[]) {
  return classes.filter(Boolean).join(" ");
}
