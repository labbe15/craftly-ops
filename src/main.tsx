import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerServiceWorker } from "./pwa/registerSW";

createRoot(document.getElementById("root")!).render(<App />);

// Register service worker for PWA (only in production)
// Disabled during initial deployment to avoid caching issues
if (import.meta.env.PROD && import.meta.env.VITE_ENABLE_SW !== 'false') {
  registerServiceWorker();
}
