import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ApiError } from "@/lib/api-error";
import "./index.css";
import App from "./App.tsx";
import { ThemeProvider } from "next-themes";
import { AuthModalProvider } from "./hooks/use-auth-modal.tsx";
import { CreatePostModalProvider } from "./hooks/use-create-post-modal.tsx";
import { EditPostModalProvider } from "./hooks/use-edit-post-modal.tsx";
import { TooltipProvider } from "@/components/ui/tooltip";

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js", { scope: "/" });
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: (failureCount, error) => {
        if (error instanceof ApiError && error.status === 429) return false;
        return failureCount < 3;
      },
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      storageKey="echo-theme"
      enableSystem
    >
      <TooltipProvider>
        <QueryClientProvider client={queryClient}>
          <AuthModalProvider>
            <CreatePostModalProvider>
              <EditPostModalProvider>
                <App />
              </EditPostModalProvider>
            </CreatePostModalProvider>
          </AuthModalProvider>
        </QueryClientProvider>
      </TooltipProvider>
    </ThemeProvider>
  </StrictMode>,
);
