import { useEffect, useRef, useState, useCallback } from 'react';
import { useTheme } from './theme';

/**
 * Constants for accessibility
 */
export const A11Y_ROLES = {
  ALERT: 'alert',
  ALERTDIALOG: 'alertdialog',
  BUTTON: 'button',
  CHECKBOX: 'checkbox',
  DIALOG: 'dialog',
  GRID: 'grid',
  LINK: 'link',
  LISTBOX: 'listbox',
  MENU: 'menu',
  MENUITEM: 'menuitem',
  MENUITEMCHECKBOX: 'menuitemcheckbox',
  MENUITEMRADIO: 'menuitemradio',
  OPTION: 'option',
  PROGRESSBAR: 'progressbar',
  RADIO: 'radio',
  SCROLLBAR: 'scrollbar',
  SLIDER: 'slider',
  SPINBUTTON: 'spinbutton',
  STATUS: 'status',
  TAB: 'tab',
  TABLIST: 'tablist',
  TABPANEL: 'tabpanel',
  TEXTBOX: 'textbox',
  TIMER: 'timer',
  TOOLTIP: 'tooltip',
  TREE: 'tree',
  TREEGRID: 'treegrid',
  TREEITEM: 'treeitem'
};

/**
 * WCAG conformance levels
 */
export const WCAG_LEVEL = {
  A: 'A',
  AA: 'AA',
  AAA: 'AAA'
};

/**
 * Hook to manage focus trapping within a container
 * @param {Object} options - Options for focus trap
 * @returns {Object} Focus trap ref and utilities
 */
export const useFocusTrap = (options = {}) => {
  const {
    active = true,
    initialFocus = null,
    returnFocusOnDeactivate = true,
    escapeDeactivates = true,
    clickOutsideDeactivates = false,
    onDeactivate = () => {}
  } = options;
  
  const containerRef = useRef(null);
  const previouslyFocusedElement = useRef(null);
  const [isFocusTrapActive, setIsFocusTrapActive] = useState(active);
  
  // Handle focus of first/last focusable elements
  const handleTabKey = useCallback((e) => {
    if (!containerRef.current) return;
    
    const focusableElements = containerRef.current.querySelectorAll(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    // If shift+tab on first element, move to last element
    if (e.shiftKey && document.activeElement === firstElement) {
      e.preventDefault();
      lastElement.focus();
    } 
    // If tab on last element, move to first element
    else if (!e.shiftKey && document.activeElement === lastElement) {
      e.preventDefault();
      firstElement.focus();
    }
  }, []);
  
  // Handle keyboard events (tab and escape)
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Tab') {
      handleTabKey(e);
    } else if (e.key === 'Escape' && escapeDeactivates) {
      setIsFocusTrapActive(false);
      onDeactivate();
    }
  }, [handleTabKey, escapeDeactivates, onDeactivate]);
  
  // Handle clicks outside the container
  const handleOutsideClick = useCallback((e) => {
    if (
      containerRef.current && 
      !containerRef.current.contains(e.target) && 
      clickOutsideDeactivates
    ) {
      setIsFocusTrapActive(false);
      onDeactivate();
    }
  }, [clickOutsideDeactivates, onDeactivate]);
  
  // Activate focus trap
  const activateFocusTrap = useCallback(() => {
    if (!containerRef.current) return;
    
    // Store currently focused element
    previouslyFocusedElement.current = document.activeElement;
    
    // Focus the initial element or first focusable element
    if (initialFocus && typeof initialFocus === 'function') {
      const element = initialFocus();
      if (element) {
        element.focus();
      }
    } else if (initialFocus && initialFocus.current) {
      initialFocus.current.focus();
    } else {
      const focusableElements = containerRef.current.querySelectorAll(
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      
      if (focusableElements.length > 0) {
        focusableElements[0].focus();
      } else {
        // If no focusable elements, add tabindex to container and focus it
        containerRef.current.tabIndex = -1;
        containerRef.current.focus();
      }
    }
    
    // Add event listeners
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleOutsideClick);
    
    setIsFocusTrapActive(true);
  }, [initialFocus, handleKeyDown, handleOutsideClick]);
  
  // Deactivate focus trap
  const deactivateFocusTrap = useCallback(() => {
    document.removeEventListener('keydown', handleKeyDown);
    document.removeEventListener('mousedown', handleOutsideClick);
    
    if (returnFocusOnDeactivate && previouslyFocusedElement.current) {
      previouslyFocusedElement.current.focus();
    }
    
    setIsFocusTrapActive(false);
  }, [handleKeyDown, handleOutsideClick, returnFocusOnDeactivate]);
  
  // Set up focus trap when active state changes
  useEffect(() => {
    if (active && !isFocusTrapActive) {
      activateFocusTrap();
    } else if (!active && isFocusTrapActive) {
      deactivateFocusTrap();
    }
  }, [active, isFocusTrapActive, activateFocusTrap, deactivateFocusTrap]);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (isFocusTrapActive) {
        document.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('mousedown', handleOutsideClick);
        
        if (returnFocusOnDeactivate && previouslyFocusedElement.current) {
          previouslyFocusedElement.current.focus();
        }
      }
    };
  }, [isFocusTrapActive, handleKeyDown, handleOutsideClick, returnFocusOnDeactivate]);
  
  return {
    ref: containerRef,
    active: isFocusTrapActive,
    activate: activateFocusTrap,
    deactivate: deactivateFocusTrap
  };
};

/**
 * Hook for managing live regions for screen readers
 * @param {Object} options - Options for live region
 * @returns {Object} Live region ref and methods
 */
export const useLiveRegion = (options = {}) => {
  const {
    ariaLive = 'polite', // 'polite' or 'assertive'
    ariaRelevant = 'additions', // 'additions', 'removals', 'text', 'all'
    ariaAtomic = false, // Whether to announce entire content (true) or just changes (false)
    clearAfter = 7000 // Time in ms to clear message, 0 to disable auto-clearing
  } = options;
  
  const regionRef = useRef(null);
  const [message, setMessage] = useState('');
  const timeoutRef = useRef(null);
  
  // Announce a message to screen readers
  const announce = useCallback((newMessage, priority) => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    setMessage(newMessage);
    
    // Temporarily override aria-live if priority is provided
    if (priority && regionRef.current) {
      const currentAriaLive = regionRef.current.getAttribute('aria-live');
      regionRef.current.setAttribute('aria-live', priority);
      
      // Reset aria-live after announcement
      setTimeout(() => {
        if (regionRef.current) {
          regionRef.current.setAttribute('aria-live', currentAriaLive);
        }
      }, 100);
    }
    
    // Set timeout to clear message if needed
    if (clearAfter > 0) {
      timeoutRef.current = setTimeout(() => {
        setMessage('');
      }, clearAfter);
    }
  }, [clearAfter]);
  
  // Clear the current message
  const clear = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setMessage('');
  }, []);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
  
  return {
    ref: regionRef,
    message,
    announce,
    clear,
    regionProps: {
      'aria-live': ariaLive,
      'aria-relevant': ariaRelevant,
      'aria-atomic': ariaAtomic.toString(),
      className: 'sr-only', // Screen-reader only
      ref: regionRef
    }
  };
};

/**
 * Hook for detecting external keyboard navigation
 * @returns {boolean} Whether user is navigating with keyboard
 */
export const useKeyboardNavigation = () => {
  const [isNavigatingWithKeyboard, setIsNavigatingWithKeyboard] = useState(false);
  
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Tab') {
        setIsNavigatingWithKeyboard(true);
      }
    };
    
    const handleMouseDown = () => {
      setIsNavigatingWithKeyboard(false);
    };
    
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);
  
  return isNavigatingWithKeyboard;
};

/**
 * Hook for skip navigation link functionality
 * @param {string} targetId - ID of the main content to skip to
 * @returns {Object} Skip link props
 */
export const useSkipLink = (targetId = 'main-content') => {
  const handleSkip = useCallback((e) => {
    e.preventDefault();
    const targetElement = document.getElementById(targetId);
    
    if (targetElement) {
      // Add tabindex to make it focusable if needed
      if (!targetElement.hasAttribute('tabindex')) {
        targetElement.setAttribute('tabindex', '-1');
      }
      
      // Focus and scroll to the element
      targetElement.focus();
      
      // Restore original state if we added tabindex
      if (targetElement.getAttribute('tabindex') === '-1') {
        // Wait a bit before removing to ensure focus is handled properly
        setTimeout(() => {
          targetElement.removeAttribute('tabindex');
        }, 100);
      }
    }
  }, [targetId]);
  
  return {
    skipLinkProps: {
      href: `#${targetId}`,
      onClick: handleSkip,
      className: 'skip-link',
      'aria-label': 'Skip to main content'
    }
  };
};

/**
 * Hook for managing modals accessibly
 * @param {Object} options - Modal options
 * @returns {Object} Modal accessibility props and state
 */
export const useAccessibleModal = (options = {}) => {
  const {
    initialOpen = false,
    onOpen = () => {},
    onClose = () => {},
    onEscape = null,
    returnFocus = true
  } = options;
  
  const [isOpen, setIsOpen] = useState(initialOpen);
  const modalRef = useRef(null);
  const previousFocusRef = useRef(null);
  
  const open = useCallback(() => {
    previousFocusRef.current = document.activeElement;
    setIsOpen(true);
    onOpen();
    
    // Lock body scroll
    document.body.style.overflow = 'hidden';
    
    // Add ARIA attributes to indicate modal is open
    document.documentElement.setAttribute('aria-hidden', 'true');
    
    // Exclude the modal from aria-hidden
    if (modalRef.current) {
      modalRef.current.setAttribute('aria-modal', 'true');
      modalRef.current.removeAttribute('aria-hidden');
    }
  }, [onOpen]);
  
  const close = useCallback(() => {
    setIsOpen(false);
    onClose();
    
    // Restore body scroll
    document.body.style.overflow = '';
    
    // Restore ARIA attributes
    document.documentElement.removeAttribute('aria-hidden');
    
    // Return focus to previously focused element
    if (returnFocus && previousFocusRef.current) {
      previousFocusRef.current.focus();
    }
  }, [onClose, returnFocus]);
  
  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        if (onEscape) {
          onEscape();
        } else {
          close();
        }
      }
    };
    
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, close, onEscape]);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (isOpen) {
        // Restore body scroll and ARIA attributes
        document.body.style.overflow = '';
        document.documentElement.removeAttribute('aria-hidden');
      }
    };
  }, [isOpen]);
  
  const focusTrap = useFocusTrap({
    active: isOpen,
    returnFocusOnDeactivate: returnFocus,
    onDeactivate: close
  });
  
  return {
    isOpen,
    open,
    close,
    modalRef,
    modalProps: {
      role: 'dialog',
      'aria-modal': 'true',
      'aria-labelledby': options.titleId,
      'aria-describedby': options.descriptionId,
      ref: focusTrap.ref || modalRef
    },
    overlayProps: {
      onClick: (e) => {
        if (e.target === e.currentTarget) {
          close();
        }
      }
    }
  };
};

/**
 * Check if a color has sufficient contrast for accessibility
 * @param {string} foreground - Foreground color in hex format
 * @param {string} background - Background color in hex format
 * @param {string} level - WCAG level (AA or AAA)
 * @param {boolean} isLargeText - Whether text is large (>=18pt or >=14pt bold)
 * @returns {boolean} Whether contrast is sufficient
 */
export const hasAccessibleContrast = (foreground, background, level = WCAG_LEVEL.AA, isLargeText = false) => {
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
  
  const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  
  // WCAG 2.0 criteria
  if (level === WCAG_LEVEL.AAA) {
    return isLargeText ? ratio >= 4.5 : ratio >= 7;
  }
  
  // Default to AA level
  return isLargeText ? ratio >= 3 : ratio >= 4.5;
};

/**
 * Generate accessible props for elements
 * @param {string} role - ARIA role
 * @param {Object} options - Additional options
 * @returns {Object} Accessibility props
 */
export const getA11yProps = (role, options = {}) => {
  const props = { role };
  
  switch (role) {
    case A11Y_ROLES.BUTTON:
      return {
        role: 'button',
        tabIndex: options.disabled ? -1 : 0,
        'aria-disabled': options.disabled ? 'true' : undefined,
        'aria-pressed': options.pressed,
        'aria-expanded': options.expanded,
        onKeyDown: options.disabled ? undefined : (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            options.onClick?.(e);
          }
        }
      };
      
    case A11Y_ROLES.CHECKBOX:
      return {
        role: 'checkbox',
        tabIndex: options.disabled ? -1 : 0,
        'aria-checked': options.checked ? 'true' : 'false',
        'aria-disabled': options.disabled ? 'true' : undefined,
        onKeyDown: options.disabled ? undefined : (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            options.onChange?.(!options.checked);
          }
        }
      };
      
    case A11Y_ROLES.LISTBOX:
      return {
        role: 'listbox',
        'aria-disabled': options.disabled ? 'true' : undefined,
        'aria-multiselectable': options.multiselectable ? 'true' : undefined,
        'aria-activedescendant': options.activeId
      };
      
    case A11Y_ROLES.OPTION:
      return {
        role: 'option',
        id: options.id,
        'aria-selected': options.selected ? 'true' : 'false',
        'aria-disabled': options.disabled ? 'true' : undefined
      };
      
    case A11Y_ROLES.DIALOG:
    case A11Y_ROLES.ALERTDIALOG:
      return {
        role,
        'aria-modal': 'true',
        'aria-labelledby': options.titleId,
        'aria-describedby': options.descriptionId
      };
      
    case A11Y_ROLES.TAB:
      return {
        role: 'tab',
        id: options.id,
        tabIndex: options.selected ? 0 : -1,
        'aria-selected': options.selected ? 'true' : 'false',
        'aria-controls': options.panelId,
        'aria-disabled': options.disabled ? 'true' : undefined
      };
      
    case A11Y_ROLES.TABPANEL:
      return {
        role: 'tabpanel',
        id: options.id,
        'aria-labelledby': options.tabId,
        tabIndex: 0
      };
      
    case A11Y_ROLES.PROGRESSBAR:
      return {
        role: 'progressbar',
        'aria-valuenow': options.value,
        'aria-valuemin': options.min || 0,
        'aria-valuemax': options.max || 100,
        'aria-valuetext': options.valueText
      };
      
    default:
      return props;
  }
};

/**
 * Hook for a11y-enhanced click handler that supports keyboard activation
 * @param {Function} onClick - Click handler
 * @param {Object} options - Options
 * @returns {Object} Event handlers
 */
export const useA11yClick = (onClick, options = {}) => {
  const { disabled = false } = options;
  
  const handleClick = useCallback((e) => {
    if (disabled) {
      e.preventDefault();
      return;
    }
    onClick?.(e);
  }, [onClick, disabled]);
  
  const handleKeyDown = useCallback((e) => {
    if (disabled) return;
    
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick?.(e);
    }
  }, [onClick, disabled]);
  
  return {
    onClick: handleClick,
    onKeyDown: handleKeyDown,
    role: 'button',
    tabIndex: disabled ? -1 : 0,
    'aria-disabled': disabled ? 'true' : undefined
  };
};

/**
 * Get preferred color scheme and accessibility settings
 * @returns {Object} User preferences
 */
export const getAccessibilityPreferences = () => {
  return {
    prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    prefersReducedTransparency: window.matchMedia('(prefers-reduced-transparency: reduce)').matches,
    prefersContrastMore: window.matchMedia('(prefers-contrast: more)').matches,
    prefersContrastLess: window.matchMedia('(prefers-contrast: less)').matches,
    prefersDarkScheme: window.matchMedia('(prefers-color-scheme: dark)').matches,
    prefersLightScheme: window.matchMedia('(prefers-color-scheme: light)').matches
  };
};

/**
 * CSS classes for screen reader only content
 */
export const SR_ONLY_STYLE = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: '0',
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  borderWidth: '0'
};

/**
 * Validate form field for accessibility issues
 * @param {string} fieldType - Type of field
 * @param {Object} props - Field props
 * @returns {Array} Accessibility issues
 */
export const validateA11yField = (fieldType, props) => {
  const issues = [];
  
  // Common checks for all field types
  if (!props.id) {
    issues.push('Field is missing an id attribute, which is required for proper label association.');
  }
  
  if (!props['aria-label'] && !props['aria-labelledby']) {
    issues.push('Field needs either aria-label or aria-labelledby when there is no visible label.');
  }
  
  // Field-specific checks
  switch (fieldType) {
    case 'input':
      if (props.type === 'checkbox' || props.type === 'radio') {
        if (props.required && !props['aria-required']) {
          issues.push('Required checkbox/radio should have aria-required="true".');
        }
      }
      break;
      
    case 'button':
      if (!props.children && !props['aria-label'] && !props.title) {
        issues.push('Button has no accessible name. Add text content, aria-label, or title.');
      }
      break;
      
    case 'select':
      if (props.required && !props['aria-required']) {
        issues.push('Required select should have aria-required="true".');
      }
      break;
      
    case 'textarea':
      if (props.required && !props['aria-required']) {
        issues.push('Required textarea should have aria-required="true".');
      }
      break;
  }
  
  return issues;
};

export default {
  useFocusTrap,
  useLiveRegion,
  useKeyboardNavigation,
  useSkipLink,
  useAccessibleModal,
  useA11yClick,
  getA11yProps,
  getAccessibilityPreferences,
  hasAccessibleContrast,
  validateA11yField,
  A11Y_ROLES,
  WCAG_LEVEL,
  SR_ONLY_STYLE
}; 
