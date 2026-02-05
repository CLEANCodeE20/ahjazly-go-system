import { createRoot } from "react-dom/client";
console.log('[Main] Entry point reached');
import App from "./App.tsx";
import "./index.css";

import { GlobalErrorBoundary } from "./components/error/GlobalErrorBoundary";
import * as Sentry from "@sentry/react";

// Only enable Sentry in production
if (import.meta.env.PROD) {
    Sentry.init({
        dsn: "https://5f391917ea330f0f1c8dee8d2022fe41@o4510671251177472.ingest.us.sentry.io/4510671254257664",
        integrations: [
            Sentry.browserTracingIntegration(),
            Sentry.replayIntegration(),
        ],
        // Tracing
        tracesSampleRate: 1.0,
        // Session Replay
        replaysSessionSampleRate: 0.1,
        replaysOnErrorSampleRate: 1.0,
        sendDefaultPii: true
    });
    console.log('[Sentry] Initialized in production mode');
} else {
    console.log('[Sentry] Disabled in development mode');
}

createRoot(document.getElementById("root")!).render(
    <GlobalErrorBoundary>
        <App />
    </GlobalErrorBoundary>
);
