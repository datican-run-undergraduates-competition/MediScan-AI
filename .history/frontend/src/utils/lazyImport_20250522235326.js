import React, { lazy } from 'react';

/**
 * Enhanced lazy loading utility that preserves component names for debugging
 * and applies default loading/error boundaries.
 *
 * @param {Function} importFn - Import function returning a promise (e.g., () => import('./Component'))
 * @param {string} exportName - Optional export name for named exports
 * @returns {React.LazyExoticComponent} - Lazy loaded component
 */
export function lazyImport(importFn, exportName = 'default') {
  // Create a named lazy component that preserves the original component name
  const LazyComponent = lazy(() => 
    importFn().then(module => ({
      // Handle default or named exports
      default: module[exportName]
    }))
  );

  // Set displayName for better debugging
  const componentName = 
    exportName === 'default' 
      ? importFn.toString().match(/[^\/]+(?='\))/)?.[0] || 'LazyComponent'
      : exportName;
      
  LazyComponent.displayName = `Lazy(${componentName})`;
  
  return LazyComponent;
}

/**
 * Creates a lazy-loaded component with a specified fallback
 *
 * @param {Function} importFn - Import function returning a promise
 * @param {React.ReactNode} fallback - Fallback component to show while loading
 * @param {string} exportName - Optional export name for named exports
 * @returns {React.FC} - Component with built-in Suspense
 */
export function createLazyComponent(importFn, fallback, exportName = 'default') {
  const LazyComponent = lazyImport(importFn, exportName);
  
  const WrappedComponent = (props) => (
    <React.Suspense fallback={fallback || <DefaultLoadingFallback />}>
      <LazyComponent {...props} />
    </React.Suspense>
  );
  
  // Preserve display name for debugging
  WrappedComponent.displayName = `LazyLoaded(${LazyComponent.displayName})`;
  
  return WrappedComponent;
}

/**
 * Default loading fallback for lazy components
 */
export const DefaultLoadingFallback = () => (
  <div className="flex items-center justify-center min-h-[200px]">
    <div className="w-10 h-10 border-t-4 border-b-4 border-blue-500 rounded-full animate-spin"></div>
  </div>
);

/**
 * Utility to lazy load a group of components at once for code splitting
 * 
 * @param {Object} components - Object with component paths
 * @returns {Object} - Object with lazy-loaded components
 */
export function lazyLoadComponents(components) {
  return Object.keys(components).reduce((acc, key) => {
    const [importPath, exportName = 'default'] = components[key].split('#');
    
    acc[key] = lazyImport(
      () => import(`../${importPath}`), 
      exportName
    );
    
    return acc;
  }, {});
}

export default lazyImport; 
