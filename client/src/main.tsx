import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./index.css";
import App from "./App.tsx";
import { ThemeProvider } from "./components/theme-provider.tsx";
import { AuthModalProvider } from "./hooks/use-auth-modal.tsx";
import { CreatePostModalProvider } from "./hooks/use-create-post-modal.tsx";
import { TooltipProvider } from "@/components/ui/tooltip";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider defaultTheme="system" storageKey="echo-theme">
      <TooltipProvider>
        <QueryClientProvider client={queryClient}>
          <AuthModalProvider>
            <CreatePostModalProvider>
              <App />
            </CreatePostModalProvider>
          </AuthModalProvider>
        </QueryClientProvider>
      </TooltipProvider>
    </ThemeProvider>
  </StrictMode>,
);
