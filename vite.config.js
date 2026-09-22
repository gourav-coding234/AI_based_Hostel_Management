import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Bind on all interfaces so the dev server can be opened from a phone
    // on the same Wi-Fi (http://<your-computer-ip>:5173) for real-device
    // testing, not just the desktop it runs on.
    host: true,
    port: 5173,
  },
  preview: {
    host: true,
    port: 4173,
  },
  build: {
    // Vendor libraries change far less often than app code; splitting them
    // out means a redeploy doesn't invalidate the user's cached copy of
    // React and Firebase.
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: "firebase", test: /node_modules[\\/]@?firebase/ },
            { name: "react-vendor", test: /node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/ },
            { name: "xlsx", test: /node_modules[\\/]xlsx/ },
          ],
        },
      },
    },
    chunkSizeWarningLimit: 700,
  },
});
