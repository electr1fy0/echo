import { Toast } from "@base-ui/react/toast";
import { cn } from "@/lib/utils";
import {
  XIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  InfoIcon,
} from "lucide-react";

const toastManager = Toast.createToastManager();

export const toast = {
  success: (description: string, options?: any) =>
    toastManager.add({ description, type: "success", ...options }),
  error: (description: string, options?: any) =>
    toastManager.add({ description, type: "error", ...options }),
  info: (description: string, options?: any) =>
    toastManager.add({ description, type: "info", ...options }),
  warning: (description: string, options?: any) =>
    toastManager.add({ description, type: "warning", ...options }),
  custom: (options: any) => toastManager.add(options),
};

export function Toaster() {
  const { toasts } = Toast.useToastManager();

  return (
    <Toast.Provider toastManager={toastManager}>
      <Toast.Portal>
        <Toast.Viewport
          className={cn(
            "fixed z-50 flex flex-col gap-2 w-full max-w-sm",
            "bottom-[calc(env(safe-area-inset-bottom)+16px)] left-1/2 -translate-x-1/2 px-4",
            "md:bottom-4 md:right-4 md:left-auto md:translate-x-0 md:px-0",
          )}
        >
          {toasts.map((toast) => (
            <Toast.Root
              key={toast.id}
              toast={toast}
              className={cn(
                "group relative pointer-events-auto flex w-full items-center justify-between space-x-4 overflow-hidden rounded-2xl border bg-card p-4 shadow-lg transition-all",
                "data-[starting-style]:translate-y-full data-[starting-style]:opacity-0",
                "data-[ending-style]:translate-y-full data-[ending-style]:opacity-0",
                "ring-1 ring-foreground/10",
                toast.type === "error" &&
                  "border-destructive/20 bg-destructive/5 text-destructive",
                toast.type === "success" &&
                  "border-green-500/20 bg-green-500/5 text-green-700 dark:text-green-400",
                toast.type === "warning" &&
                  "border-yellow-500/20 bg-yellow-500/5 text-yellow-700 dark:text-yellow-400",
              )}
            >
              <Toast.Content className="flex-1 flex items-start gap-3">
                {toast.type === "success" && (
                  <CheckCircleIcon className="size-5 shrink-0" />
                )}
                {toast.type === "error" && (
                  <AlertCircleIcon className="size-5 shrink-0" />
                )}
                {toast.type === "warning" && (
                  <AlertCircleIcon className="size-5 shrink-0" />
                )}
                {toast.type === "info" && (
                  <InfoIcon className="size-5 shrink-0" />
                )}

                <div className="grid gap-1">
                  {toast.title && (
                    <Toast.Title className="text-sm font-semibold">
                      {toast.title}
                    </Toast.Title>
                  )}
                  <Toast.Description className="text-sm opacity-90">
                    {toast.description}
                  </Toast.Description>
                </div>
              </Toast.Content>
              <Toast.Close className="absolute top-2 right-2 rounded-full p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 group-has-[data-type]:text-current">
                <XIcon className="size-4" />
              </Toast.Close>
            </Toast.Root>
          ))}
        </Toast.Viewport>
      </Toast.Portal>
    </Toast.Provider>
  );
}
