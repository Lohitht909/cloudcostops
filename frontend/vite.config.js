import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  server: {
    host: "0.0.0.0",
    port: 3000,

    allowedHosts: [
      "k8s-cloudcos-cloudcos-e1bd232905-1211250675.us-east-1.elb.amazonaws.com"
    ],

    proxy: {
      "/api": {
        target: "http://cloudcostops-backend:8000",
        changeOrigin: true
      }
    }
  }
});