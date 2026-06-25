import { toastManager } from "@/components/ui/toast";
import { useRegisterSW } from "virtual:pwa-register/react";
import { useEffect } from "react";

export function ReloadPrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, registration) {
      if (!registration) return;

      const check = () => {
        try {
          registration.update();
        } catch {
          /* network or browser errors */
        }
      };

      if (registration.waiting) {
        setNeedRefresh(true);
      }

      check();
      setInterval(check, 60_000);

      const onVisibilityChange = () => {
        if (document.visibilityState === "visible") check();
      };

      document.addEventListener("visibilitychange", onVisibilityChange);
      window.addEventListener("focus", check);
    },
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
