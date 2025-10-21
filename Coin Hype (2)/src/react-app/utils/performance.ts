// Performance monitoring and optimization utilities
// This module provides tools for monitoring app performance and optimizing user experience

interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  interactionTime: number;
  memoryUsage?: number;
  frameRate?: number;
}

interface ComponentPerformance {
  componentName: string;
  renderTime: number;
  propsCount: number;
  childrenCount: number;
}

class PerformanceMonitor {
  private componentMetrics: ComponentPerformance[] = [];
  private frameCount = 0;
  private lastFrameTime = performance.now();

  // Monitor component render performance
  measureComponentRender<T>(componentName: string, renderFn: () => T): T {
    const startTime = performance.now();
    const result = renderFn();
    const renderTime = performance.now() - startTime;

    this.componentMetrics.push({
      componentName,
      renderTime,
      propsCount: 0, // Would need to be passed in
      childrenCount: 0 // Would need to be passed in
    });

    // Log slow renders
    if (renderTime > 16) { // More than one frame at 60fps
      console.warn(`Slow render detected: ${componentName} took ${renderTime.toFixed(2)}ms`);
    }

    return result;
  }

  // Monitor async operations
  async measureAsync<T>(operationName: string, asyncFn: () => Promise<T>): Promise<T> {
    const startTime = performance.now();
    try {
      const result = await asyncFn();
      const duration = performance.now() - startTime;
      
      console.log(`${operationName} completed in ${duration.toFixed(2)}ms`);
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      console.error(`${operationName} failed after ${duration.toFixed(2)}ms:`, error);
      throw error;
    }
  }

  // Monitor frame rate
  startFrameRateMonitoring() {
    const measureFrameRate = () => {
      const currentTime = performance.now();
      const timeDelta = currentTime - this.lastFrameTime;
      
      if (timeDelta >= 1000) { // Every second
        const fps = Math.round((this.frameCount * 1000) / timeDelta);
        
        if (fps < 30) {
          console.warn(`Low frame rate detected: ${fps} FPS`);
        }
        
        this.frameCount = 0;
        this.lastFrameTime = currentTime;
      }
      
      this.frameCount++;
      requestAnimationFrame(measureFrameRate);
    };
    
    requestAnimationFrame(measureFrameRate);
  }

  // Monitor memory usage
  getMemoryUsage(): number | undefined {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return memory.usedJSHeapSize / 1024 / 1024; // MB
    }
    return undefined;
  }

  // Get performance summary
  getPerformanceSummary() {
    const memoryUsage = this.getMemoryUsage();
    const slowComponents = this.componentMetrics
      .filter(metric => metric.renderTime > 16)
      .sort((a, b) => b.renderTime - a.renderTime);

    return {
      memoryUsage,
      slowComponents: slowComponents.slice(0, 10), // Top 10 slow components
      averageRenderTime: this.componentMetrics.length > 0 
        ? this.componentMetrics.reduce((sum, m) => sum + m.renderTime, 0) / this.componentMetrics.length 
        : 0
    };
  }

  // Clear metrics
  clearMetrics() {
    this.componentMetrics = [];
  }
}

// React performance hooks
export function usePerformanceMonitor() {
  const monitor = new PerformanceMonitor();
  
  return {
    measureRender: monitor.measureComponentRender.bind(monitor),
    measureAsync: monitor.measureAsync.bind(monitor),
    getSummary: monitor.getPerformanceSummary.bind(monitor)
  };
}

// Game performance optimization
class GamePerformanceOptimizer {
  private animationFrameId?: number;
  private targetFPS = 60;
  private frameTime = 1000 / this.targetFPS;

  // Throttle game animations to maintain 60fps
  throttleAnimation(callback: () => void): void {
    let lastTime = 0;
    
    const animate = (currentTime: number) => {
      if (currentTime - lastTime >= this.frameTime) {
        callback();
        lastTime = currentTime;
      }
      this.animationFrameId = requestAnimationFrame(animate);
    };
    
    this.animationFrameId = requestAnimationFrame(animate);
  }

  // Stop animations
  stopAnimation(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = undefined;
    }
  }

  // Optimize game asset loading
  preloadGameAssets(assetUrls: string[]): Promise<void[]> {
    const loadPromises = assetUrls.map(url => {
      return new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => reject(new Error(`Failed to load asset: ${url}`));
        img.src = url;
      });
    });

    return Promise.all(loadPromises);
  }

  // Batch DOM updates
  batchDOMUpdates(updates: Array<() => void>): void {
    requestAnimationFrame(() => {
      updates.forEach(update => update());
    });
  }
}

// Initialize global performance monitoring
const globalPerformanceMonitor = new PerformanceMonitor();

// Start monitoring on app load
if (typeof window !== 'undefined') {
  globalPerformanceMonitor.startFrameRateMonitoring();
  
  // Monitor page visibility changes
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      console.log('Page became hidden - pausing non-critical operations');
    } else {
      console.log('Page became visible - resuming operations');
    }
  });
}

export { globalPerformanceMonitor, PerformanceMonitor };
export { GamePerformanceOptimizer };
export type { PerformanceMetrics, ComponentPerformance };
