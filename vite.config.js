import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React runtime — cached long-term by browsers
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          // Supabase client — large but stable
          "vendor-supabase": ["@supabase/supabase-js"],
          // Image compression — only needed on service form
          "vendor-compression": ["browser-image-compression"],
        },
      },
    },
    // Raise the warning threshold slightly — supabase is legitimately large
    chunkSizeWarningLimit: 600,
  },
});
