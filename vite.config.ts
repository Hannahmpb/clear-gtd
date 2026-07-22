import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icon-180.png", "icon-512.png"],
      manifest: {
        name: "Clear — Getting Things Done",
        short_name: "Clear",
        start_url: "/",
        scope: "/",
        display: "standalone",
        background_color: "#f6f5f1",
        theme_color: "#f6f5f1",
        icons: [
          { src: "icon-180.png", sizes: "180x180", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png" },
        ],
      },
      workbox: {
        navigateFallback: "/index.html",
        globPatterns: ["**/*.{js,css,html,png,svg,ico}"],
        navigateFallbackDenylist: [/\/rest\/v1\//],
      },
    }),
  ],
});
