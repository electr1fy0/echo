import { Toast } from "@base-ui/react/toast";
import { cn } from "@/lib/utils";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Cancel01Icon,
  Tick02Icon,
  Alert01Icon,
  InformationCircleIcon,
} from "@hugeicons/core-free-icons";
import { buttonVariants } from "@/components/ui/button-variants";
import { toastManager } from "@/lib/toast";

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
            "ring-1 ring-foreground/5",
            toast.type === "error" && "border-destructive/20",
            toast.type === "success" && "border-green-600/20",
            toast.type === "warning" && "border-yellow-600/20"
          )}
        >
          <Toast.Content className="flex-1 flex items-start gap-3">
            {toast.type === "success" && (
              <HugeiconsIcon
                icon={Tick02Icon}
                className="size-5 shrink-0 text-green-600"
              />
            )}
            {toast.type === "error" && (
              <HugeiconsIcon
                icon={Alert01Icon}
                className="size-5 shrink-0 text-destructive"
              />
            )}
            {toast.type === "warning" && (
              <HugeiconsIcon
                icon={Alert01Icon}
                className="size-5 shrink-0 text-yellow-600"
              />
            )}
            {toast.type === "info" && (
              <HugeiconsIcon
                icon={InformationCircleIcon}
                className="size-5 shrink-0 text-foreground"
              />
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
              <Toast.Action
                className={cn(
                  buttonVariants({ variant: "outline", size: "xs" }),
                  "mt-2 w-fit border-border text-foreground hover:bg-muted",
                  !toast.actionProps && "hidden"
                )}
              />
            </div>
          </Toast.Content>
          <Toast.Close className="absolute top-2 right-2 rounded-full p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2">
            <HugeiconsIcon icon={Cancel01Icon} className="size-4" />
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
