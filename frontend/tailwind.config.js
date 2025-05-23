/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Use CSS variables for colors to support dynamic themes
        background: 'var(--color-background)',
        foreground: 'var(--color-foreground)',
        primary: 'var(--color-primary)',
        secondary: 'var(--color-secondary)',
        accent: 'var(--color-accent)',
        error: 'var(--color-error)',
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        info: 'var(--color-info)',
        surface: 'var(--color-surface)',
        border: 'var(--color-border)',
      },
      fontFamily: {
        sans: [
          'Inter var',
          'Inter',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
        mono: [
          'JetBrains Mono',
          'Menlo',
          'Monaco',
          'Consolas',
          'Liberation Mono',
          'Courier New',
          'monospace',
        ],
      },
      fontSize: {
        // Use CSS variable for base font size to support dynamic text size
        base: 'var(--font-size-base, 16px)',
      },
      lineHeight: {
        // Use CSS variable for base line height to support dynamic text size
        base: 'var(--line-height-base, 1.5)',
      },
      screens: {
        'xs': '480px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
      },
      spacing: {
        '72': '18rem',
        '80': '20rem',
        '96': '24rem',
        '112': '28rem',
        '128': '32rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in',
        'slide-in-up': 'slideInUp 0.4s ease-out',
        'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      boxShadow: {
        'inner-lg': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
      },
      transitionDuration: {
        '2000': '2000ms',
      },
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
      },
    },
  },
  variants: {
    extend: {
      backgroundColor: ['active', 'disabled'],
      textColor: ['active', 'disabled'],
      borderColor: ['active', 'disabled'],
      opacity: ['disabled'],
      cursor: ['disabled'],
      ringColor: ['focus-visible'],
      ringWidth: ['focus-visible'],
      ringOffsetWidth: ['focus-visible'],
      ringOffsetColor: ['focus-visible'],
    },
  },
  plugins: [
    // Plugin for screen-reader-only utilities
    function ({ addUtilities }) {
      const newUtilities = {
        '.sr-only': {
          position: 'absolute',
          width: '1px',
          height: '1px',
          padding: '0',
          margin: '-1px',
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          whiteSpace: 'nowrap',
          borderWidth: '0',
        },
        '.not-sr-only': {
          position: 'static',
          width: 'auto',
          height: 'auto',
          padding: '0',
          margin: '0',
          overflow: 'visible',
          clip: 'auto',
          whiteSpace: 'normal',
        },
      };
      
      addUtilities(newUtilities, ['responsive', 'focus']);
    },
    
    // Plugin for focus-visible utilities
    function({ addVariant, e }) {
      addVariant('focus-visible', ({ modifySelectors, separator }) => {
        modifySelectors(({ className }) => {
          return `.${e(`focus-visible${separator}${className}`)}:focus-visible`;
        });
      });
    },
    
    // Plugin for reduced-motion utilities
    function({ addVariant, e }) {
      addVariant('motion-reduce', ({ modifySelectors, separator }) => {
        modifySelectors(({ className }) => {
          return `.${e(`motion-reduce${separator}${className}`)}:where(.reduced-motion *)`;
        });
      });
    },
    
    // Plugin for high-contrast utilities
    function({ addVariant, e }) {
      addVariant('contrast-high', ({ modifySelectors, separator }) => {
        modifySelectors(({ className }) => {
          return `.${e(`contrast-high${separator}${className}`)}:where(.high-contrast *)`;
        });
      });
    },
    
    // Plugin for large-text utilities
    function({ addVariant, e }) {
      addVariant('text-large', ({ modifySelectors, separator }) => {
        modifySelectors(({ className }) => {
          return `.${e(`text-large${separator}${className}`)}:where(.large-text *)`;
        });
      });
    },
  ],
}; 
