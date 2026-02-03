import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "prompt",
      includeAssets: ["echo.svg", "echologo.svg", "thumb.jpeg"],
      manifest: {
        name: "Echo - An Open QnA Platform",
        short_name: "Echo",
        description:
          "Echo is an open Q&A platform where you can ask questions, share knowledge, and connect with communities through chambers.",
        theme_color: "#171717",
        background_color: "#171717",
        display: "standalone",
        icons: [
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        mode: "development",
        runtimeCaching: [
          {
            urlPattern: ({ url }) => {
              return (
                url.origin.includes("echo-server.up.railway.app") &&
                url.pathname.match(
                  /^\/(auth|users|questions|chambers|search)/
                ) &&
                true
              );
            },
            handler: "NetworkOnly",
            options: {
              cacheName: "api-cache",
            },
          },
          {
            urlPattern: ({ request }) => request.destination === "image",
            handler: "CacheFirst",
            options: {
              cacheName: "images",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 2592000,
              },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom", "react-router"],
          ui: ["@base-ui/react", "@hugeicons/react", "@hugeicons/core-free-icons"],
        },
      },
    },
  },
});
