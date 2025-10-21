import React from "react";
import { createRoot } from "react-dom/client";
import "@/react-app/index.css";
import App from "@/react-app/App";

// Ensure proper polyfills for browser compatibility
if (typeof window !== 'undefined') {
  // Minimal process polyfill
  if (!(window as any).process) {
    (window as any).process = {
      env: { NODE_ENV: 'production' },
      browser: true
    };
  }
  
  // Global reference
  if (!(window as any).global) {
    (window as any).global = globalThis;
  }
}

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element not found");
}

const root = createRoot(rootElement);

// Wrap in try-catch to handle any remaining issues
try {
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} catch (error) {
  console.error('Failed to render app:', error);
  // Fallback render without StrictMode
  root.render(<App />);
}

// Initialize performance optimizations after React is loaded
if (typeof window !== 'undefined') {
  Promise.resolve().then(() => {
    import("@/react-app/utils/performanceOptimizer").then(({ initializePerformanceOptimizations, PerformanceMonitor }) => {
      const initTimer = PerformanceMonitor.startTiming('app_initialization');
      initializePerformanceOptimizations();
      
      window.addEventListener('load', () => {
        initTimer();
        console.log('🚀 CoinHype loaded with performance optimizations');
      });
    }).catch(() => {
      // Silently handle performance optimization failures
    });
  });
  
  // Initialize referral tracking after app loads
  Promise.resolve().then(() => {
    import("@/react-app/utils/referralTracker").then(({ ReferralTracker }) => {
      ReferralTracker.initialize();
    }).catch(() => {
      // Silently handle referral tracking failures
    });
  });
}
