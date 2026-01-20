import { Toast } from "@base-ui/react/toast";
import { cn } from "@/lib/utils";
import {
  XIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  InfoIcon,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

const toastManager = Toast.createToastManager();

const transformOptions = (options?: any) => {
  if (!options) return {};
  const { action, ...rest } = options;
  if (action) {
    return {
      ...rest,
      actionProps: {
        children: action.label,
        onClick: action.onClick,
      },
    };
  }
  return options;
};

export const toast = {
  success: (description: string, options?: any) =>
    toastManager.add({ description, type: "success", ...transformOptions(options) }),
  error: (description: string, options?: any) =>
    toastManager.add({ description, type: "error", ...transformOptions(options) }),
  info: (description: string, options?: any) =>
    toastManager.add({ description, type: "info", ...transformOptions(options) }),
  warning: (description: string, options?: any) =>
    toastManager.add({ description, type: "warning", ...transformOptions(options) }),
  custom: (options: any) => toastManager.add(transformOptions(options)),
};

function ToastList() {
  const { toasts } = Toast.useToastManager();

  return (
    <>
      {toasts.map((toast) => (
        <Toast.Root
          key={toast.id}
          toast={toast}
          className={cn(
            "group relative pointer-events-auto flex w-full items-center justify-between space-x-4 overflow-hidden rounded-4xl border bg-background p-4 shadow-lg transition-all",
            "data-[starting-style]:translate-y-full data-[starting-style]:opacity-0",
            "data-[ending-style]:translate-y-full data-[ending-style]:opacity-0",
            "ring-1 ring-foreground/10",
            toast.type === "error" &&
              "border-destructive bg-destructive text-destructive-foreground",
            toast.type === "success" &&
              "border-green-600 bg-green-600 text-white",
            toast.type === "warning" &&
              "border-yellow-600 bg-yellow-600 text-white"
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
            {toast.type === "info" && <InfoIcon className="size-5 shrink-0" />}

            <div className="grid gap-1">
              {toast.title && (
                <Toast.Title className="text-sm font-semibold">
                  {toast.title}
                </Toast.Title>
              )}
              <Toast.Description className="text-sm opacity-90">
                {toast.description}
              </Toast.Description>
              <Toast.Action
                className={cn(
                  buttonVariants({ variant: "outline", size: "xs" }),
                  "mt-2 w-fit bg-transparent hover:bg-white/10 border-current text-current",
                  !toast.actionProps && "hidden"
                )}
              />
            </div>
          </Toast.Content>
          <Toast.Close className="absolute top-2 right-2 rounded-full p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 group-has-[data-type]:text-current">
            <XIcon className="size-4" />
          </Toast.Close>
        </Toast.Root>
      ))}
    </>
  );
}

export function Toaster() {
  return (
    <Toast.Provider toastManager={toastManager}>
      <Toast.Portal>
        <Toast.Viewport
          className={cn(
            "fixed z-50 flex flex-col gap-2 w-full max-w-[calc(100%-2rem)] sm:max-w-sm",
            "bottom-[calc(env(safe-area-inset-bottom,0px)+32px)] left-1/2 -translate-x-1/2",
            "md:bottom-4 md:right-4 md:left-auto md:translate-x-0",
          )}
        >
          <ToastList />
        </Toast.Viewport>
      </Toast.Portal>
    </Toast.Provider>
  );
}
