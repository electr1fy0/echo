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
  const isActive = (type: SchemaField["type"]) =>
    fields.some((f) => f.type === type);

  const handleToggle = (type: SchemaField["type"], checked: boolean) => {
    const defaultLabels: Record<string, string> = {
      currency: "Price",
      datetime: "Date-Time",
      file: "File",
      image: "Image Photo",
      poll: "Poll",
      location: "Location",
      source_destination: "Source → Destination",
      key_value: "Key:Value",
      button: "DM Button",
    };

    const nextFields = [...fields];
    const index = nextFields.findIndex((f) => f.type === type);

    if (index !== -1) {
      nextFields.splice(index, 1);
    } else if (checked) {
      nextFields.push({
        id: `standard_${type}`,
        type,
        label: defaultLabels[type] || "Field",
        required: false,
      });
    }

    onChange(nextFields);
  };

  return (
    <div className="space-y-3 pt-3 border-t border-neutral-100 dark:border-neutral-900/60">
      <span className="text-xs font-bold text-neutral-950 dark:text-white block mb-1">
        Configure Channel Fields
      </span>

      <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
        {STANDARD_FIELDS.map((sf) => {
          const Icon = sf.icon;
          const active = isActive(sf.type);

          return (
            <div
              key={sf.type}
              className="flex items-center gap-3 p-3 border border-neutral-200 dark:border-neutral-800 rounded-xl transition-all duration-200 bg-transparent hover:bg-neutral-50/20 dark:hover:bg-neutral-900/10 cursor-pointer"
              onClick={() => handleToggle(sf.type, !active)}
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
                    ? "font-bold text-neutral-900 dark:text-white"
                    : "font-semibold text-neutral-400 dark:text-neutral-500",
                )}
              >
                {sf.label}
              </span>
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
