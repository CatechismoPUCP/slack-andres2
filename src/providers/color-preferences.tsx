import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type ColorPreference = '' | 'green' | 'blue';

interface ColorPreferencesContextType {
  color: ColorPreference;
  selectColor: (color: ColorPreference) => void;
}

const ColorPreferencesContext = createContext<ColorPreferencesContextType | undefined>(undefined);

export function ColorPreferencesProvider({ children }: { children: ReactNode }) {
  const [color, setColor] = useState<ColorPreference>('');

  useEffect(() => {
    // Load color preference from localStorage on mount
    try {
      const stored = localStorage.getItem('color-preference');
      if (stored && (stored === 'green' || stored === 'blue')) {
        setColor(stored as ColorPreference);
      }
    } catch (error) {
      console.error('Failed to load color preference:', error);
    }
  }, []);

  const selectColor = (newColor: ColorPreference) => {
    setColor(newColor);
    try {
      localStorage.setItem('color-preference', newColor);
    } catch (error) {
      console.error('Failed to save color preference:', error);
    }
  };

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('color-green', 'color-blue');
    if (color) {
      root.classList.add(`color-${color}`);
    }
  }, [color]);

  return (
    <ColorPreferencesContext.Provider value={{ color, selectColor }}>
      {children}
    </ColorPreferencesContext.Provider>
  );
}

export function useColorPreferences() {
  const context = useContext(ColorPreferencesContext);
  if (!context) {
    throw new Error('useColorPreferences must be used within ColorPreferencesProvider');
  }
  return context;
}
