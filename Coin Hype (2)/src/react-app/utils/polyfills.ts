// Minimal browser polyfills for casino app
// Fixed version that doesn't interfere with React or Vite module externalization

export function setupPolyfills() {
  if (typeof window !== 'undefined') {
    // Add minimal process polyfill only if needed
    if (!(window as any).process) {
      (window as any).process = {
        env: { NODE_ENV: process.env.NODE_ENV || 'production' },
        browser: true,
        version: '',
        versions: { node: '' },
        nextTick: (callback: () => void) => setTimeout(callback, 0)
      };
    }
    
    // Add global reference only if needed
    if (!(window as any).global) {
      (window as any).global = window;
    }

    // Remove any Buffer references - let Vite handle externalization
    // Do not polyfill Buffer as it conflicts with Vite's module system
  }
}
