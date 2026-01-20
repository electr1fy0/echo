import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./index.css";
import App from "./App.tsx";
import { ThemeProvider } from "./components/theme-provider.tsx";
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

const APP_VERSION = __APP_VERSION__;
const storedVersion = localStorage.getItem("app_version");

if (storedVersion && storedVersion !== APP_VERSION) {
  localStorage.clear();
  location.reload();
}

localStorage.setItem("app_version", APP_VERSION);

window.addEventListener("unhandledrejection", (event) => {
  const msg = String(event.reason);
  if (
    msg.includes("Loading chunk") ||
    msg.includes("Failed to fetch dynamically imported module")
  ) {
    location.reload();
  }
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider defaultTheme="system" storageKey="echo-theme">
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </ThemeProvider>
  </StrictMode>,
);
