import { createContext, useContext, useState, useEffect } from 'react';

// Theme constants
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  HIGH_CONTRAST: 'high-contrast',
  REDUCED_MOTION: 'reduced-motion',
  LARGE_TEXT: 'large-text'
};

// Default theme based on system preference
const getDefaultTheme = () => {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) return savedTheme;
  
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? THEMES.DARK
    : THEMES.LIGHT;
};

// Default accessibility preferences
const getDefaultAccessibilityPreferences = () => {
  const savedPrefs = localStorage.getItem('accessibilityPreferences');
  if (savedPrefs) {
    try {
      return JSON.parse(savedPrefs);
    } catch (e) {
      console.error('Failed to parse saved accessibility preferences', e);
    }
  }
  
  return {
    highContrast: window.matchMedia('(prefers-contrast: more)').matches,
    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    largeText: false,
    textSpacing: false,
    focusIndicators: true
  };
};

// Define theme context
const ThemeContext = createContext();

/**
 * Theme provider component
 * @param {Object} props - Component props
 * @returns {JSX.Element} Provider component
 */
export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(getDefaultTheme);
  const [accessibility, setAccessibility] = useState(getDefaultAccessibilityPreferences);
  
  // Apply theme to document
  useEffect(() => {
    // Remove previous themes
    document.documentElement.classList.remove(
      THEMES.LIGHT,
      THEMES.DARK,
      THEMES.HIGH_CONTRAST
    );
    
    // Apply current theme
    document.documentElement.classList.add(theme);
    
    // Apply accessibility classes
    document.documentElement.classList.toggle('high-contrast', accessibility.highContrast);
    document.documentElement.classList.toggle('reduced-motion', accessibility.reducedMotion);
    document.documentElement.classList.toggle('large-text', accessibility.largeText);
    document.documentElement.classList.toggle('text-spacing', accessibility.textSpacing);
    document.documentElement.classList.toggle('focus-indicators', accessibility.focusIndicators);
    
    // Store preferences
    localStorage.setItem('theme', theme);
    localStorage.setItem('accessibilityPreferences', JSON.stringify(accessibility));
    
    // Set meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name=theme-color]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute(
        'content',
        theme === THEMES.DARK ? '#121212' : 
        theme === THEMES.HIGH_CONTRAST ? '#000000' : '#ffffff'
      );
    }
  }, [theme, accessibility]);
  
  // Listen for system preference changes
  useEffect(() => {
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const highContrastMediaQuery = window.matchMedia('(prefers-contrast: more)');
    const reducedMotionMediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    const handleDarkModeChange = (e) => {
      // Only update if using system preference (no manual override)
      if (!localStorage.getItem('theme')) {
        setTheme(e.matches ? THEMES.DARK : THEMES.LIGHT);
      }
    };
    
    const handleHighContrastChange = (e) => {
      setAccessibility(prev => ({ ...prev, highContrast: e.matches }));
    };
    
    const handleReducedMotionChange = (e) => {
      setAccessibility(prev => ({ ...prev, reducedMotion: e.matches }));
    };
    
    // Add listeners
    darkModeMediaQuery.addEventListener('change', handleDarkModeChange);
    highContrastMediaQuery.addEventListener('change', handleHighContrastChange);
    reducedMotionMediaQuery.addEventListener('change', handleReducedMotionChange);
    
    // Cleanup
    return () => {
      darkModeMediaQuery.removeEventListener('change', handleDarkModeChange);
      highContrastMediaQuery.removeEventListener('change', handleHighContrastChange);
      reducedMotionMediaQuery.removeEventListener('change', handleReducedMotionChange);
    };
  }, []);
  
  /**
   * Change the theme
   * @param {string} newTheme - New theme to apply
   */
  const changeTheme = (newTheme) => {
    if (Object.values(THEMES).includes(newTheme)) {
      setTheme(newTheme);
    }
  };
  
  /**
   * Toggle between light and dark themes
   */
  const toggleTheme = () => {
    setTheme(prevTheme => 
      prevTheme === THEMES.LIGHT ? THEMES.DARK : THEMES.LIGHT
    );
  };
  
  /**
   * Update accessibility preferences
   * @param {Object} newPreferences - New accessibility preferences
   */
  const updateAccessibility = (newPreferences) => {
    setAccessibility(prev => ({ ...prev, ...newPreferences }));
  };
  
  /**
   * Enable or disable high contrast mode
   * @param {boolean} enabled - Whether to enable high contrast
   */
  const toggleHighContrast = () => {
    setAccessibility(prev => ({ ...prev, highContrast: !prev.highContrast }));
  };
  
  /**
   * Enable or disable reduced motion
   * @param {boolean} enabled - Whether to enable reduced motion
   */
  const toggleReducedMotion = () => {
    setAccessibility(prev => ({ ...prev, reducedMotion: !prev.reducedMotion }));
  };
  
  /**
   * Enable or disable large text
   * @param {boolean} enabled - Whether to enable large text
   */
  const toggleLargeText = () => {
    setAccessibility(prev => ({ ...prev, largeText: !prev.largeText }));
  };
  
  /**
   * Get CSS variables for current theme
   * @returns {Object} CSS variables
   */
  const getThemeColors = () => {
    const isHighContrast = accessibility.highContrast;
    const isDark = theme === THEMES.DARK;
    
    if (isHighContrast) {
      return {
        '--color-background': isDark ? '#000000' : '#ffffff',
        '--color-foreground': isDark ? '#ffffff' : '#000000',
        '--color-primary': isDark ? '#ffff00' : '#000080',
        '--color-secondary': isDark ? '#00ffff' : '#800000',
        '--color-accent': isDark ? '#ff00ff' : '#008000',
        '--color-error': '#ff0000',
        '--color-success': '#00ff00',
        '--color-warning': '#ffff00',
        '--color-info': '#00ffff',
        '--color-surface': isDark ? '#121212' : '#f8f8f8',
        '--color-border': isDark ? '#ffffff' : '#000000',
        '--color-shadow': 'rgba(0, 0, 0, 0.5)',
        '--contrast-ratio': '21:1'
      };
    }
    
    if (isDark) {
      return {
        '--color-background': '#121212',
        '--color-foreground': '#e0e0e0',
        '--color-primary': '#90caf9',
        '--color-secondary': '#ce93d8',
        '--color-accent': '#ff9e80',
        '--color-error': '#f44336',
        '--color-success': '#4caf50',
        '--color-warning': '#ff9800',
        '--color-info': '#2196f3',
        '--color-surface': '#1e1e1e',
        '--color-border': '#333333',
        '--color-shadow': 'rgba(0, 0, 0, 0.3)',
        '--contrast-ratio': '7:1'
      };
    }
    
    return {
      '--color-background': '#ffffff',
      '--color-foreground': '#333333',
      '--color-primary': '#1976d2',
      '--color-secondary': '#9c27b0',
      '--color-accent': '#ff5722',
      '--color-error': '#f44336',
      '--color-success': '#4caf50',
      '--color-warning': '#ff9800',
      '--color-info': '#2196f3',
      '--color-surface': '#f8f8f8',
      '--color-border': '#e0e0e0',
      '--color-shadow': 'rgba(0, 0, 0, 0.1)',
      '--contrast-ratio': '4.5:1'
    };
  };
  
  // Context value
  const contextValue = {
    theme,
    isDark: theme === THEMES.DARK,
    isHighContrast: accessibility.highContrast,
    isReducedMotion: accessibility.reducedMotion,
    isLargeText: accessibility.largeText,
    accessibilityPreferences: accessibility,
    changeTheme,
    toggleTheme,
    updateAccessibility,
    toggleHighContrast,
    toggleReducedMotion,
    toggleLargeText,
    getThemeColors
  };
  
  return (
    <ThemeContext.Provider value={contextValue}>
      <ThemeStyleInjector />
      {children}
    </ThemeContext.Provider>
  );
};

/**
 * Component to inject theme CSS variables
 */
const ThemeStyleInjector = () => {
  const { getThemeColors, isLargeText } = useContext(ThemeContext);
  
  useEffect(() => {
    const colors = getThemeColors();
    
    // Apply CSS variables to root
    Object.entries(colors).forEach(([property, value]) => {
      document.documentElement.style.setProperty(property, value);
    });
    
    // Set text size variables
    if (isLargeText) {
      document.documentElement.style.setProperty('--font-size-base', '18px');
      document.documentElement.style.setProperty('--line-height-base', '1.6');
    } else {
      document.documentElement.style.setProperty('--font-size-base', '16px');
      document.documentElement.style.setProperty('--line-height-base', '1.5');
    }
  }, [getThemeColors, isLargeText]);
  
  return null;
};

/**
 * Hook to use the theme context
 * @returns {Object} Theme context
 */
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

/**
 * Utility function to check if a color has sufficient contrast with another color
 * @param {string} foreground - Foreground color in hex format
 * @param {string} background - Background color in hex format
 * @returns {boolean} Whether the contrast is sufficient
 */
export const hasEnoughContrast = (foreground, background) => {
  // Convert hex to rgb
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };
  
  // Calculate luminance
  const luminance = (r, g, b) => {
    const a = [r, g, b].map(v => {
      v /= 255;
      return v <= 0.03928
        ? v / 12.92
        : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
  };
  
  const rgb1 = hexToRgb(foreground);
  const rgb2 = hexToRgb(background);
  
  if (!rgb1 || !rgb2) return false;
  
  const l1 = luminance(rgb1.r, rgb1.g, rgb1.b);
  const l2 = luminance(rgb2.r, rgb2.g, rgb2.b);
  
  const contrast = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  
  // WCAG 2.0 level AA requires 4.5:1 for normal text and 3:1 for large text
  return contrast >= 4.5;
};

/**
 * Generate a theme color palette
 * @param {string} baseColor - Base color in hex format
 * @param {boolean} isDark - Whether to generate a dark palette
 * @returns {Object} Color palette
 */
export const generateColorPalette = (baseColor, isDark = false) => {
  // Simplified palette generation logic
  const lightVariant = isDark ? shadeColor(baseColor, 30) : shadeColor(baseColor, 70);
  const darkVariant = isDark ? shadeColor(baseColor, -30) : shadeColor(baseColor, -30);
  
  return {
    main: baseColor,
    light: lightVariant,
    dark: darkVariant,
    contrastText: isDark ? '#ffffff' : '#000000'
  };
};

/**
 * Shade a hex color
 * @param {string} color - Hex color code
 * @param {number} percent - Percent to lighten (positive) or darken (negative)
 * @returns {string} Shaded color
 */
const shadeColor = (color, percent) => {
  const f = parseInt(color.slice(1), 16);
  const t = percent < 0 ? 0 : 255;
  const p = percent < 0 ? percent * -1 : percent;
  
  const R = f >> 16;
  const G = (f >> 8) & 0x00ff;
  const B = f & 0x0000ff;
  
  return `#${(
    0x1000000 +
    (Math.round((t - R) * p / 100) + R) * 0x10000 +
    (Math.round((t - G) * p / 100) + G) * 0x100 +
    (Math.round((t - B) * p / 100) + B)
  ).toString(16).slice(1)}`;
};

export default {
  ThemeProvider,
  useTheme,
  THEMES,
  hasEnoughContrast,
  generateColorPalette
}; 
