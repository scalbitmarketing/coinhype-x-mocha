/**
 * Performance optimization utilities for CoinHype casino
 */

// Asset preloader with compression
export class AssetPreloader {
  private static cache = new Map<string, any>();
  private static loadingPromises = new Map<string, Promise<any>>();

  /**
   * Preload critical game assets
   */
  static async preloadCriticalAssets(): Promise<void> {
    const criticalAssets = [
      // Game icons (high priority)
      'https://mocha-cdn.com/019a03c8-927d-7b47-8386-6b32d1946c8e/dice-game-icon-no-text.png',
      'https://mocha-cdn.com/019a03c8-927d-7b47-8386-6b32d1946c8e/crash-game-icon-no-text.png',
      
      // Essential UI assets
      '/favicon-32x32.png',
      '/apple-touch-icon-180x180.png'
    ];

    await Promise.allSettled(
      criticalAssets.map(url => this.preloadImage(url))
    );
  }

  /**
   * Lazy load game assets on interaction
   */
  static async lazyLoadGameAssets(): Promise<void> {
    const gameAssets = [
      'https://mocha-cdn.com/019a03c8-927d-7b47-8386-6b32d1946c8e/mines-game-icon-no-text.png',
      'https://mocha-cdn.com/019a03c8-927d-7b47-8386-6b32d1946c8e/plinko-game-icon-no-text.png',
      'https://mocha-cdn.com/019a03c8-927d-7b47-8386-6b32d1946c8e/slots-game-icon-no-text.png',
      'https://mocha-cdn.com/019a03c8-927d-7b47-8386-6b32d1946c8e/roulette-game-icon-no-text.png',
      'https://mocha-cdn.com/019a03c8-927d-7b47-8386-6b32d1946c8e/blackjack-game-icon-no-text.png',
      'https://mocha-cdn.com/019a03c8-927d-7b47-8386-6b32d1946c8e/poker-game-icon-no-text.png'
    ];

    // Load in batches to avoid overwhelming the browser
    const batchSize = 2;
    for (let i = 0; i < gameAssets.length; i += batchSize) {
      const batch = gameAssets.slice(i, i + batchSize);
      await Promise.allSettled(
        batch.map(url => this.preloadImage(url))
      );
    }
  }

  /**
   * Preload a single image with caching
   */
  private static preloadImage(url: string): Promise<HTMLImageElement> {
    // Return cached promise if already loading/loaded
    if (this.loadingPromises.has(url)) {
      return this.loadingPromises.get(url)!;
    }

    // Check cache first
    if (this.cache.has(url)) {
      return Promise.resolve(this.cache.get(url));
    }

    const promise = new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      
      // Add timeout to prevent hanging
      const timeout = setTimeout(() => {
        reject(new Error(`Image load timeout: ${url}`));
      }, 10000);

      img.onload = () => {
        clearTimeout(timeout);
        this.cache.set(url, img);
        this.loadingPromises.delete(url);
        resolve(img);
      };

      img.onerror = () => {
        clearTimeout(timeout);
        this.loadingPromises.delete(url);
        reject(new Error(`Failed to load image: ${url}`));
      };

      // Enable CORS and compression hints
      img.crossOrigin = 'anonymous';
      img.decoding = 'async';
      img.loading = 'eager';
      img.src = url;
    });

    this.loadingPromises.set(url, promise);
    return promise;
  }

  /**
   * Get cached image or null
   */
  static getCachedImage(url: string): HTMLImageElement | null {
    return this.cache.get(url) || null;
  }

  /**
   * Clear cache to free memory
   */
  static clearCache(): void {
    this.cache.clear();
    this.loadingPromises.clear();
  }
}

// Frame rate optimizer
export class FrameRateOptimizer {
  private static rafId: number | null = null;
  private static callbacks: Set<() => void> = new Set();
  private static lastTime = 0;
  private static targetFPS = 60;
  private static frameTime = 1000 / 60;

  /**
   * Register a callback for 60fps updates
   */
  static addCallback(callback: () => void): void {
    this.callbacks.add(callback);
    if (!this.rafId) {
      this.startLoop();
    }
  }

  /**
   * Unregister a callback
   */
  static removeCallback(callback: () => void): void {
    this.callbacks.delete(callback);
    if (this.callbacks.size === 0) {
      this.stopLoop();
    }
  }

  private static startLoop(): void {
    const loop = (currentTime: number) => {
      if (currentTime - this.lastTime >= this.frameTime) {
        this.callbacks.forEach(callback => {
          try {
            callback();
          } catch (error) {
            console.error('Frame callback error:', error);
          }
        });
        this.lastTime = currentTime;
      }
      
      this.rafId = requestAnimationFrame(loop);
    };
    
    this.rafId = requestAnimationFrame(loop);
  }

  private static stopLoop(): void {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  /**
   * Set target FPS (default 60)
   */
  static setTargetFPS(fps: number): void {
    this.targetFPS = Math.max(30, Math.min(120, fps));
    this.frameTime = 1000 / this.targetFPS;
  }
}

// Performance monitor
export class PerformanceMonitor {
  private static metrics: Map<string, number[]> = new Map();
  private static enabled = process.env.NODE_ENV === 'development';

  /**
   * Start timing an operation
   */
  static startTiming(label: string): () => void {
    if (!this.enabled) return () => {};
    
    const startTime = performance.now();
    
    return () => {
      const duration = performance.now() - startTime;
      this.recordMetric(label, duration);
    };
  }

  /**
   * Record a performance metric
   */
  static recordMetric(label: string, value: number): void {
    if (!this.enabled) return;
    
    if (!this.metrics.has(label)) {
      this.metrics.set(label, []);
    }
    
    const values = this.metrics.get(label)!;
    values.push(value);
    
    // Keep only last 100 measurements
    if (values.length > 100) {
      values.shift();
    }
  }

  /**
   * Get performance statistics
   */
  static getStats(label: string): { avg: number; min: number; max: number } | null {
    if (!this.enabled) return null;
    
    const values = this.metrics.get(label);
    if (!values || values.length === 0) return null;
    
    const sum = values.reduce((a, b) => a + b, 0);
    return {
      avg: sum / values.length,
      min: Math.min(...values),
      max: Math.max(...values)
    };
  }

  /**
   * Log all performance statistics
   */
  static logStats(): void {
    if (!this.enabled) return;
    
    console.group('🎯 Performance Stats');
    this.metrics.forEach((_, label) => {
      const stats = this.getStats(label);
      if (stats) {
        console.log(`${label}: avg=${stats.avg.toFixed(2)}ms, min=${stats.min.toFixed(2)}ms, max=${stats.max.toFixed(2)}ms`);
      }
    });
    console.groupEnd();
  }

  /**
   * Clear all metrics
   */
  static clear(): void {
    this.metrics.clear();
  }
}

// Bundle size optimizer
export const bundleOptimizations = {
  /**
   * Lazy load React components
   */
  lazyComponent: <T extends React.ComponentType<any>>(
    importFn: () => Promise<{ default: T }>
  ) => {
    return lazy(() => 
      importFn().catch(() => 
        Promise.resolve({ 
          default: (() => createElement('div', {}, 'Failed to load component')) as any as T
        })
      )
    );
  },

  /**
   * Code split by route
   */
  routeComponent: <T extends React.ComponentType<any>>(
    importFn: () => Promise<{ default: T }>
  ) => {
    const Component = lazy(importFn);
    
    return memo((props: any) => (
      createElement(Suspense, {
        fallback: createElement('div', { 
          className: 'min-h-screen flex items-center justify-center' 
        }, createElement('div', { 
          className: 'text-white' 
        }, 'Loading...'))
      }, createElement(Component, props))
    ));
  }
};

// Import React functions
import { lazy, createElement, memo, Suspense } from 'react';

// Initialize performance optimizations
export function initializePerformanceOptimizations(): void {
  // Preload critical assets immediately
  AssetPreloader.preloadCriticalAssets();
  
  // Lazy load other assets after interaction
  const handleFirstInteraction = () => {
    AssetPreloader.lazyLoadGameAssets();
    document.removeEventListener('click', handleFirstInteraction);
    document.removeEventListener('touchstart', handleFirstInteraction);
  };
  
  document.addEventListener('click', handleFirstInteraction, { once: true });
  document.addEventListener('touchstart', handleFirstInteraction, { once: true });
  
  // Set up performance monitoring
  if (process.env.NODE_ENV === 'development') {
    // Log stats every 30 seconds
    setInterval(() => {
      PerformanceMonitor.logStats();
    }, 30000);
  }
  
  // Optimize frame rate for mobile
  if (/Mobi|Android/i.test(navigator.userAgent)) {
    FrameRateOptimizer.setTargetFPS(30); // Lower FPS on mobile to save battery
  }
}
