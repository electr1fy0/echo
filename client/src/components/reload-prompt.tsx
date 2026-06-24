import { toastManager } from "@/components/ui/toast";
import { useRegisterSW } from "virtual:pwa-register/react";
import { useEffect } from "react";

export function ReloadPrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisterError(error) {
      console.error("SW registration error", error);
    },
  });

  useEffect(() => {
    if (needRefresh) {
      toastManager.add({
        title: "New version available",
        description: "Click refresh to update to the latest version.",
        type: "info",
        actionProps: {
          children: "Refresh",
          onClick: () => {
            updateServiceWorker(true);
            setNeedRefresh(false);
          },
        },
        timeout: Infinity,
      });
    }
  }, [needRefresh, updateServiceWorker, setNeedRefresh]);

  return null;
}
