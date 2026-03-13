import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

const root = createRoot(document.getElementById("root")!);
root.render(<App />);

// Hide the HTML app shell once React has mounted
const shell = document.getElementById("app-shell");
if (shell) {
  shell.classList.add("ready");
  setTimeout(() => shell.remove(), 500);
}

// Register service worker in production
if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", async () => {
    try {
      const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      reg.addEventListener("updatefound", () => {
        const newWorker = reg.installing;
        if (!newWorker) return;
        newWorker.addEventListener("statechange", () => {
          if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
            console.log("[PWA] Nueva versión disponible. Recarga para actualizar.");
          }
        });
      });
    } catch {
      // SW registration failed silently
    }
  });
}
