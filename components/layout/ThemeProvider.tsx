
"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type Theme = "light" | "dark";

type ThemeContextType = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = "telechat-theme";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");
  const [ready, setReady] = useState(false);

  // Read the saved theme once when the app loads.
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem(STORAGE_KEY);

      if (savedTheme === "light" || savedTheme === "dark") {
        setThemeState(savedTheme);
      }
    } catch {
      // Continue using the default theme if storage is unavailable.
    }

    setReady(true);
  }, []);

  // Apply the theme globally to the entire application.
  useEffect(() => {
    if (!ready) return;

    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    root.style.colorScheme = theme;

    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // The theme still works for the current session.
    }
  }, [theme, ready]);

  function setTheme(nextTheme: Theme) {
    setThemeState(nextTheme);
  }

  function toggleTheme() {
    setThemeState((current) =>
      current === "dark" ? "light" : "dark"
    );
  }

  return (
    <ThemeContext.Provider
      value={{ theme, setTheme, toggleTheme }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error(
      "useTheme must be used inside ThemeProvider"
    );
  }

  return context;
}