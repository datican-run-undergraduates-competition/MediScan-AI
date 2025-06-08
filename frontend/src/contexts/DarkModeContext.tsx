'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface DarkModeContextType {
  darkMode: boolean;
  toggleDarkMode: () => void;
}

const DarkModeContext = createContext<DarkModeContextType>({
  darkMode: false,
  toggleDarkMode: () => {},
});

export const useDarkMode = () => useContext(DarkModeContext);

interface DarkModeProviderProps {
  children: ReactNode;
}

export const DarkModeProvider = ({ children }: DarkModeProviderProps) => {
  const [darkMode, setDarkMode] = useState(false);

  // Initialize dark mode preference from localStorage
  useEffect(() => {
    // Check localStorage for saved preference
    const savedMode = localStorage.getItem('darkMode');
    
    // Check if the user has a system preference
    const prefersDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Use saved preference or system preference
    if (savedMode !== null) {
      setDarkMode(savedMode === 'true');
    } else {
      setDarkMode(prefersDarkMode);
    }
  }, []);

  // Apply dark mode class to body element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark-mode');
      document.documentElement.style.colorScheme = 'dark';
    } else {
      document.documentElement.classList.remove('dark-mode');
      document.documentElement.style.colorScheme = 'light';
    }
    
    // Save preference to localStorage
    localStorage.setItem('darkMode', String(darkMode));
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <DarkModeContext.Provider value={{ darkMode, toggleDarkMode }}>
      {children}
    </DarkModeContext.Provider>
  );
};

export default DarkModeContext; 