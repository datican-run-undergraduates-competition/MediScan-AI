import { useEffect, useState, useRef } from 'react';
import { useTheme } from './theme';

/**
 * Basic animation variants for Framer Motion
 */
export const ANIMATION_VARIANTS = {
  // Fade animations
  fadeIn: {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { duration: 0.3 }
    }
  },
  
  fadeInUp: {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.4, ease: 'easeOut' }
    }
  },
  
  fadeInDown: {
    hidden: { opacity: 0, y: -20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.4, ease: 'easeOut' }
    }
  },
  
  fadeInLeft: {
    hidden: { opacity: 0, x: -20 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: { duration: 0.4, ease: 'easeOut' }
    }
  },
  
  fadeInRight: {
    hidden: { opacity: 0, x: 20 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: { duration: 0.4, ease: 'easeOut' }
    }
  },
  
  // Scale animations
  zoomIn: {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { duration: 0.4, ease: 'easeOut' }
    }
  },
  
  zoomOut: {
    hidden: { opacity: 0, scale: 1.1 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { duration: 0.4, ease: 'easeOut' }
    }
  },
  
  // Staggered list animations
  listItem: {
    hidden: { opacity: 0, y: 10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.3 }
    }
  },
  
  // Page transitions
  pageTransition: {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { duration: 0.5, ease: 'easeInOut' }
    },
    exit: { 
      opacity: 0,
      transition: { duration: 0.3, ease: 'easeInOut' }
    }
  },
  
  // Notification animations
  notification: {
    hidden: { opacity: 0, y: -20, scale: 0.9 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { type: 'spring', stiffness: 200, damping: 15 }
    },
    exit: { 
      opacity: 0, 
      scale: 0.9, 
      transition: { duration: 0.2 }
    }
  },
  
  // Button feedback
  buttonTap: {
    tap: { scale: 0.97 }
  },
  
  // Card hover
  cardHover: {
    rest: { scale: 1 },
    hover: { 
      scale: 1.02,
      boxShadow: '0 10px 20px rgba(0,0,0,0.1)',
      transition: { duration: 0.3, ease: 'easeOut' }
    }
  }
};

/**
 * Get accessibility-aware animation variants
 * @param {string} variant - Variant name
 * @returns {Object} Animation variant
 */
export const getAccessibleAnimations = (variant) => {
  const { isReducedMotion } = useTheme();
  
  // If reduced motion is enabled, return simplified animations
  if (isReducedMotion) {
    // Provide reduced motion alternatives
    switch (variant) {
      case 'fadeInUp':
      case 'fadeInDown':
      case 'fadeInLeft':
      case 'fadeInRight':
        return {
          hidden: { opacity: 0 },
          visible: { 
            opacity: 1,
            transition: { duration: 0.3 }
          }
        };
        
      case 'zoomIn':
      case 'zoomOut':
        return {
          hidden: { opacity: 0 },
          visible: { 
            opacity: 1,
            transition: { duration: 0.3 }
          }
        };
        
      case 'listItem':
        return {
          hidden: { opacity: 0 },
          visible: { 
            opacity: 1,
            transition: { duration: 0.2 }
          }
        };
        
      case 'notification':
        return {
          hidden: { opacity: 0 },
          visible: { 
            opacity: 1,
            transition: { duration: 0.3 }
          },
          exit: { 
            opacity: 0, 
            transition: { duration: 0.2 }
          }
        };
        
      case 'buttonTap':
        return {}; // No animation
        
      case 'cardHover':
        return {
          rest: {},
          hover: { 
            boxShadow: '0 5px 10px rgba(0,0,0,0.1)',
            transition: { duration: 0.3 }
          }
        };
        
      default:
        return ANIMATION_VARIANTS.fadeIn;
    }
  }
  
  // Return the requested variant or default to fadeIn
  return ANIMATION_VARIANTS[variant] || ANIMATION_VARIANTS.fadeIn;
};

/**
 * Generate staggered children animation props
 * @param {number} staggerAmount - Stagger time in seconds
 * @param {number} delayStart - Initial delay in seconds
 * @returns {Object} Stagger container props
 */
export const staggerContainer = (staggerAmount = 0.1, delayStart = 0) => {
  const { isReducedMotion } = useTheme();
  
  if (isReducedMotion) {
    return {
      initial: "hidden",
      animate: "visible",
      variants: {
        visible: { 
          transition: { 
            staggerChildren: 0.05,
            delayChildren: delayStart
          } 
        },
        hidden: {}
      }
    };
  }
  
  return {
    initial: "hidden",
    animate: "visible",
    variants: {
      visible: { 
        transition: { 
          staggerChildren: staggerAmount,
          delayChildren: delayStart
        } 
      },
      hidden: {}
    }
  };
};

/**
 * Hook for scroll-triggered animations
 * @param {Object} options - Hook options
 * @returns {Object} Ref and animation controls
 */
export const useScrollAnimation = (options = {}) => {
  const { 
    threshold = 0.1, 
    triggerOnce = true,
    rootMargin = '0px'
  } = options;
  
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const { isReducedMotion } = useTheme();
  
  useEffect(() => {
    // If reduced motion is enabled and triggerOnce is true, 
    // just set to visible immediately
    if (isReducedMotion && triggerOnce) {
      setIsVisible(true);
      return;
    }
    
    const currentRef = ref.current;
    if (!currentRef) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (triggerOnce) {
            observer.disconnect();
          }
        } else if (!triggerOnce) {
          setIsVisible(false);
        }
      },
      { threshold, rootMargin }
    );
    
    observer.observe(currentRef);
    
    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [threshold, triggerOnce, rootMargin, isReducedMotion]);
  
  return { ref, isVisible };
};

/**
 * Hook for creating skeleton loading animations
 * @returns {Object} Skeleton animation styles
 */
export const useSkeletonAnimation = () => {
  const { isReducedMotion, isDark } = useTheme();
  
  // Return different animations based on preferences
  if (isReducedMotion) {
    return {
      className: "skeleton-static",
      style: {
        backgroundColor: isDark ? '#333' : '#e0e0e0',
        opacity: 0.7
      }
    };
  }
  
  return {
    className: "skeleton-pulse",
    style: {
      backgroundImage: `linear-gradient(90deg, 
        ${isDark ? '#333' : '#f0f0f0'} 25%, 
        ${isDark ? '#444' : '#e0e0e0'} 50%, 
        ${isDark ? '#333' : '#f0f0f0'} 75%
      )`,
      backgroundSize: '200% 100%',
      animation: 'skeleton-pulse 1.5s ease-in-out infinite'
    }
  };
};

/**
 * CSS keyframes for animations (to be included in global styles)
 */
export const KEYFRAMES = `
  @keyframes skeleton-pulse {
    0% {
      background-position: 100% 50%;
    }
    100% {
      background-position: 0% 50%;
    }
  }
  
  @keyframes spinner {
    to {
      transform: rotate(360deg);
    }
  }
  
  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
  
  @keyframes slideInUp {
    from {
      transform: translateY(20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
  
  @keyframes pulse {
    0% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.05);
    }
    100% {
      transform: scale(1);
    }
  }
`;

/**
 * Hook for loading spinner animation
 * @param {string} color - Spinner color
 * @param {number} size - Spinner size in pixels
 * @returns {Object} Spinner styles
 */
export const useSpinnerAnimation = (color = 'currentColor', size = 24) => {
  const { isReducedMotion, isDark } = useTheme();
  
  // Default color based on theme if not specified
  const spinnerColor = color === 'currentColor' 
    ? (isDark ? '#90caf9' : '#1976d2') 
    : color;
  
  // For reduced motion, use a simpler indicator
  if (isReducedMotion) {
    return {
      style: {
        width: `${size}px`,
        height: `${size}px`,
        backgroundColor: 'transparent',
        border: `${Math.max(2, size / 10)}px solid ${spinnerColor}`,
        borderRadius: '50%',
        opacity: 0.7
      }
    };
  }
  
  return {
    style: {
      width: `${size}px`,
      height: `${size}px`,
      border: `${Math.max(2, size / 10)}px solid rgba(0, 0, 0, 0.1)`,
      borderTopColor: spinnerColor,
      borderRadius: '50%',
      animation: 'spinner 0.8s linear infinite'
    }
  };
};

/**
 * Hook for creating micro-interactions on elements
 * @param {string} interactionType - Type of interaction (hover, tap, etc.)
 * @returns {Object} Interaction props
 */
export const useMicroInteraction = (interactionType = 'hover') => {
  const { isReducedMotion } = useTheme();
  
  // If reduced motion is enabled, return minimal interactions
  if (isReducedMotion) {
    return {};
  }
  
  switch (interactionType) {
    case 'hover':
      return {
        whileHover: { scale: 1.03, transition: { duration: 0.2 } }
      };
      
    case 'tap':
      return {
        whileTap: { scale: 0.97, transition: { duration: 0.1 } }
      };
      
    case 'pulse':
      return {
        animate: {
          scale: [1, 1.03, 1],
          transition: {
            duration: 1.5,
            repeat: Infinity,
            repeatType: 'loop'
          }
        }
      };
      
    case 'highlight':
      return {
        whileHover: { 
          backgroundColor: 'rgba(25, 118, 210, 0.1)',
          transition: { duration: 0.2 }
        }
      };
      
    default:
      return {};
  }
};

/**
 * Apply CSS animation based on class and props
 * @param {string} animationType - Type of animation
 * @param {Object} options - Animation options
 * @returns {Object} CSS class and style
 */
export const useCssAnimation = (animationType, options = {}) => {
  const { 
    duration = 0.3, 
    delay = 0, 
    timingFunction = 'ease' 
  } = options;
  
  const { isReducedMotion } = useTheme();
  
  // Skip animations for reduced motion
  if (isReducedMotion) {
    if (animationType === 'fadeIn') {
      return { className: '' };
    }
    return { className: '', style: {} };
  }
  
  // Map animation types to CSS classes and styles
  switch (animationType) {
    case 'fadeIn':
      return {
        className: 'animate-fadeIn',
        style: {
          animationDuration: `${duration}s`,
          animationDelay: `${delay}s`,
          animationTimingFunction: timingFunction,
          animationFillMode: 'both'
        }
      };
      
    case 'slideInUp':
      return {
        className: 'animate-slideInUp',
        style: {
          animationDuration: `${duration}s`,
          animationDelay: `${delay}s`,
          animationTimingFunction: timingFunction,
          animationFillMode: 'both'
        }
      };
      
    case 'pulse':
      return {
        className: 'animate-pulse',
        style: {
          animationDuration: `${duration * 2}s`,
          animationDelay: `${delay}s`,
          animationTimingFunction: timingFunction,
          animationFillMode: 'both',
          animationIterationCount: 'infinite'
        }
      };
      
    default:
      return { className: '', style: {} };
  }
};

/**
 * Hook for progressive image loading animation
 * @param {string} src - Image source
 * @param {string} placeholderSrc - Placeholder image source
 * @returns {Object} Image state and props
 */
export const useProgressiveImage = (src, placeholderSrc) => {
  const [loading, setLoading] = useState(true);
  const [currentSrc, setCurrentSrc] = useState(placeholderSrc);
  const { isReducedMotion } = useTheme();
  
  useEffect(() => {
    // Reset when src changes
    setLoading(true);
    setCurrentSrc(placeholderSrc);
    
    const img = new Image();
    img.src = src;
    img.onload = () => {
      setCurrentSrc(src);
      setLoading(false);
    };
    
    return () => {
      img.onload = null;
    };
  }, [src, placeholderSrc]);
  
  // Adjust image transition based on reduced motion preference
  const imgStyle = {
    filter: loading ? 'blur(10px)' : 'blur(0)',
    transition: isReducedMotion 
      ? 'none' 
      : 'filter 0.3s ease-out'
  };
  
  return { loading, currentSrc, imgStyle };
};

/**
 * Animation utilities for app transitions
 */
export default {
  getAccessibleAnimations,
  staggerContainer,
  useScrollAnimation,
  useSkeletonAnimation,
  useSpinnerAnimation,
  useMicroInteraction,
  useCssAnimation,
  useProgressiveImage,
  ANIMATION_VARIANTS,
  KEYFRAMES
}; 
