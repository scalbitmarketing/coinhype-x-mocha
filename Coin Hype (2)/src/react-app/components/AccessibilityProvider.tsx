import React, { createContext, useContext, useState, useEffect } from 'react';

interface AccessibilityContextValue {
  reducedMotion: boolean;
  highContrast: boolean;
  largeText: boolean;
  screenReader: boolean;
  toggleReducedMotion: () => void;
  toggleHighContrast: () => void;
  toggleLargeText: () => void;
  announceToScreenReader: (message: string) => void;
}

const AccessibilityContext = createContext<AccessibilityContextValue | null>(null);

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [largeText, setLargeText] = useState(false);
  const [screenReader, setScreenReader] = useState(false);

  useEffect(() => {
    // Check for system preferences
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);
    
    const contrastQuery = window.matchMedia('(prefers-contrast: high)');
    setHighContrast(contrastQuery.matches);

    // Detect screen reader
    const hasScreenReader = window.navigator.userAgent.includes('NVDA') || 
                           window.navigator.userAgent.includes('JAWS') ||
                           !!window.speechSynthesis;
    setScreenReader(hasScreenReader);

    // Listen for preference changes
    const handleMotionChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    const handleContrastChange = (e: MediaQueryListEvent) => setHighContrast(e.matches);
    
    mediaQuery.addEventListener('change', handleMotionChange);
    contrastQuery.addEventListener('change', handleContrastChange);
    
    return () => {
      mediaQuery.removeEventListener('change', handleMotionChange);
      contrastQuery.removeEventListener('change', handleContrastChange);
    };
  }, []);

  useEffect(() => {
    // Apply accessibility classes to document
    const root = document.documentElement;
    
    if (reducedMotion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }
    
    if (highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
    
    if (largeText) {
      root.classList.add('large-text');
    } else {
      root.classList.remove('large-text');
    }
  }, [reducedMotion, highContrast, largeText]);

  const toggleReducedMotion = () => setReducedMotion(prev => !prev);
  const toggleHighContrast = () => setHighContrast(prev => !prev);
  const toggleLargeText = () => setLargeText(prev => !prev);

  const announceToScreenReader = (message: string) => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  };

  return (
    <AccessibilityContext.Provider value={{
      reducedMotion,
      highContrast,
      largeText,
      screenReader,
      toggleReducedMotion,
      toggleHighContrast,
      toggleLargeText,
      announceToScreenReader
    }}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
}

// Custom hook for keyboard navigation
export function useKeyboardNavigation() {
  useEffect(() => {

    const handleFirstTab = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        document.body.classList.add('user-is-tabbing');
        window.removeEventListener('keydown', handleFirstTab);
        window.addEventListener('mousedown', handleMouseDown);
      }
    };

    const handleMouseDown = () => {
      document.body.classList.remove('user-is-tabbing');
      window.removeEventListener('mousedown', handleMouseDown);
      window.addEventListener('keydown', handleFirstTab);
    };

    window.addEventListener('keydown', handleFirstTab);
    
    return () => {
      window.removeEventListener('keydown', handleFirstTab);
      window.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  return { isTabbing: document.body.classList.contains('user-is-tabbing') };
}

// Skip to content link component
export function SkipToContent() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-cyan-600 focus:text-white focus:rounded focus:no-underline"
    >
      Skip to main content
    </a>
  );
}
