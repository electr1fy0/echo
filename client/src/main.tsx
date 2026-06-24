import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./index.css";
import App from "./App.tsx";
import { ThemeProvider } from "next-themes";
import { AuthModalProvider } from "./hooks/use-auth-modal.tsx";
import { CreatePostModalProvider } from "./hooks/use-create-post-modal.tsx";
import { EditPostModalProvider } from "./hooks/use-edit-post-modal.tsx";
import { TooltipProvider } from "@/components/ui/tooltip";

const queryClient = new QueryClient();

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
