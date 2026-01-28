import { toast } from "@/lib/toast";
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
      toast.info("New version available", {
        description: "Click refresh to update to the latest version.",
        action: {
          label: "Refresh",
          onClick: () => {
            updateServiceWorker(true);
            setNeedRefresh(false);
          },
        },
        duration: Infinity,
      });
    }
  }, [needRefresh, updateServiceWorker, setNeedRefresh]);

  return null;
}
