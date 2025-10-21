// Analytics and tracking utilities for Coin Hype
// This module provides comprehensive analytics tracking for user behavior,
// game performance, and business metrics

interface AnalyticsEvent {
  event: string;
  properties?: Record<string, any>;
  userId?: string;
  timestamp?: number;
}

interface GameAnalytics {
  gameType: string;
  betAmount: number;
  outcome: 'win' | 'lose' | 'tie';
  payout: number;
  duration: number;
  multiplier?: number;
}

interface UserAnalytics {
  userId?: string;
  sessionId: string;
  device: string;
  browser: string;
  country?: string;
  referrer?: string;
}

class AnalyticsManager {
  private sessionId: string;
  private userId?: string;
  private events: AnalyticsEvent[] = [];
  private gameStartTime: number = 0;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.initializeSession();
  }

  private generateSessionId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private initializeSession() {
    // Track page view
    this.track('page_view', {
      url: window.location.href,
      title: document.title,
      referrer: document.referrer,
      userAgent: navigator.userAgent,
      timestamp: Date.now()
    });

    // Track user device info
    this.track('session_start', {
      sessionId: this.sessionId,
      device: this.getDeviceInfo(),
      browser: this.getBrowserInfo(),
      screenResolution: `${screen.width}x${screen.height}`,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language
    });
  }

  setUserId(userId: string) {
    this.userId = userId;
    this.track('user_identified', { userId });
  }

  // Core tracking method
  track(event: string, properties: Record<string, any> = {}) {
    const analyticsEvent: AnalyticsEvent = {
      event,
      properties: {
        ...properties,
        sessionId: this.sessionId,
        timestamp: Date.now(),
        url: window.location.href
      },
      userId: this.userId,
      timestamp: Date.now()
    };

    this.events.push(analyticsEvent);
    
    // Send to analytics service (implement your preferred service)
    this.sendEvent(analyticsEvent);
  }

  // Game-specific tracking
  trackGameStart(gameType: string, betAmount: number) {
    this.gameStartTime = Date.now();
    this.track('game_start', {
      gameType,
      betAmount,
      currency: 'SOL'
    });
  }

  trackGameEnd(analytics: GameAnalytics) {
    const duration = Date.now() - this.gameStartTime;
    this.track('game_end', {
      ...analytics,
      duration,
      timestamp: Date.now()
    });
  }

  trackDeposit(amount: number, method: string) {
    this.track('deposit', {
      amount,
      method,
      currency: 'SOL'
    });
  }

  trackWithdrawal(amount: number, method: string) {
    this.track('withdrawal', {
      amount,
      method,
      currency: 'SOL'
    });
  }

  trackWalletConnection(walletType: string, success: boolean) {
    this.track('wallet_connection', {
      walletType,
      success,
      timestamp: Date.now()
    });
  }

  trackError(error: Error, context?: string) {
    this.track('error', {
      message: error.message,
      stack: error.stack,
      context,
      url: window.location.href,
      userAgent: navigator.userAgent
    });
  }

  trackPerformance(metric: string, value: number, unit: string = 'ms') {
    this.track('performance', {
      metric,
      value,
      unit,
      timestamp: Date.now()
    });
  }

  // Business metrics
  trackConversion(type: string, value?: number) {
    this.track('conversion', {
      type,
      value,
      timestamp: Date.now()
    });
  }

  trackRetention(daysActive: number) {
    this.track('retention', {
      daysActive,
      timestamp: Date.now()
    });
  }

  private async sendEvent(event: AnalyticsEvent) {
    try {
      // In production, replace with your analytics service
      // Examples: Google Analytics, Mixpanel, Amplitude, PostHog
      
      // For now, we'll use a simple endpoint
      await fetch('/api/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
        credentials: 'include'
      });
    } catch (error) {
      console.warn('Analytics tracking failed:', error);
    }
  }

  private getDeviceInfo(): string {
    const userAgent = navigator.userAgent;
    if (/Android/i.test(userAgent)) return 'Android';
    if (/iPhone|iPad|iPod/i.test(userAgent)) return 'iOS';
    if (/Windows/i.test(userAgent)) return 'Windows';
    if (/Mac/i.test(userAgent)) return 'Mac';
    if (/Linux/i.test(userAgent)) return 'Linux';
    return 'Unknown';
  }

  private getBrowserInfo(): string {
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Unknown';
  }

  // Get analytics summary for dashboard
  getSessionSummary() {
    return {
      sessionId: this.sessionId,
      userId: this.userId,
      eventsCount: this.events.length,
      duration: Date.now() - (this.events[0]?.timestamp || Date.now()),
      device: this.getDeviceInfo(),
      browser: this.getBrowserInfo()
    };
  }

  // Performance monitoring
  measurePageLoad() {
    if (typeof window !== 'undefined' && 'performance' in window) {
      window.addEventListener('load', () => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        
        this.trackPerformance('page_load_time', navigation.loadEventEnd - navigation.fetchStart);
        this.trackPerformance('dom_content_loaded', navigation.domContentLoadedEventEnd - navigation.fetchStart);
        this.trackPerformance('first_paint', navigation.responseEnd - navigation.fetchStart);
      });
    }
  }

  // Track Core Web Vitals
  measureWebVitals() {
    if (typeof window !== 'undefined') {
      // LCP (Largest Contentful Paint)
      new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.trackPerformance('largest_contentful_paint', lastEntry.startTime);
      }).observe({ entryTypes: ['largest-contentful-paint'] });

      // FID (First Input Delay)
      new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          this.trackPerformance('first_input_delay', (entry as any).processingStart - entry.startTime);
        }
      }).observe({ entryTypes: ['first-input'] });

      // CLS (Cumulative Layout Shift)
      let clsScore = 0;
      new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsScore += (entry as any).value;
          }
        }
        this.trackPerformance('cumulative_layout_shift', clsScore, 'score');
      }).observe({ entryTypes: ['layout-shift'] });
    }
  }
}

// Global analytics instance
export const analytics = new AnalyticsManager();

// Initialize performance monitoring
if (typeof window !== 'undefined') {
  analytics.measurePageLoad();
  analytics.measureWebVitals();
}

// Export types for use in other modules
export type { AnalyticsEvent, GameAnalytics, UserAnalytics };
