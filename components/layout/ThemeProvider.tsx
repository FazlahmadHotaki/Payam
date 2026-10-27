// components/layout/ThemeProvider.tsx
"use client";

import {
  createContext,
  useContext,
  useEffect,
  type ReactNode,
} from "react";

type ThemeContextValue = {
  theme: "light";
  setTheme: (t: "light") => void;
};

const ThemeContext = createContext<ThemeContextValue>({
  theme: "light",
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const html = document.documentElement;
    // مطمئن شو dark class پاک است
    html.classList.remove("dark");
    html.classList.add("light");
    html.style.colorScheme = "light";
  }, []);

  return (
    <ThemeContext.Provider value={{ theme: "light", setTheme: () => {} }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}