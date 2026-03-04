import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import type { ThemeId } from "@shared/matti-types";

interface MattiThemeContextType {
  currentThemeId: ThemeId;
  setCurrentThemeId: (themeId: ThemeId) => void;
}

const MattiThemeContext = createContext<MattiThemeContextType | undefined>(undefined);

export function MattiThemeProvider({ children }: { children: ReactNode }) {
  const [currentThemeId, setCurrentThemeIdState] = useState<ThemeId>("general");

  // Load theme from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("matti_current_theme");
    if (stored) {
      setCurrentThemeIdState(stored as ThemeId);
    }
  }, []);

  // Save theme to localStorage when it changes
  const setCurrentThemeId = (themeId: ThemeId) => {
    setCurrentThemeIdState(themeId);
    localStorage.setItem("matti_current_theme", themeId);
  };

  return (
    <MattiThemeContext.Provider value={{ currentThemeId, setCurrentThemeId }}>
      {children}
    </MattiThemeContext.Provider>
  );
}

export function useMattiTheme() {
  const context = useContext(MattiThemeContext);
  if (!context) {
    throw new Error("useMattiTheme must be used within MattiThemeProvider");
  }
  return context;
}
