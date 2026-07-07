"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type ColorMode = "light" | "dark" | "system";
export type FontSize = "sm" | "md" | "lg";

const COLOR_MODE_KEY = "cafe-color-mode";
const FONT_SIZE_KEY = "cafe-font-size";

interface ThemeContextValue {
  colorMode: ColorMode;
  setColorMode: (mode: ColorMode) => void;
  fontSize: FontSize;
  setFontSize: (size: FontSize) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [colorMode, setColorModeState] = useState<ColorMode>("light");
  const [fontSize, setFontSizeState] = useState<FontSize>("md");

  useEffect(() => {
    // Deliberately deferred to an effect: localStorage is unavailable during
    // SSR, so reading it in the initializer would produce a hydration
    // mismatch. Render the default on first paint, then hydrate client-side.
    try {
      const storedMode = window.localStorage.getItem(COLOR_MODE_KEY);
      if (storedMode === "light" || storedMode === "dark" || storedMode === "system") {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setColorModeState(storedMode);
      }
      const storedSize = window.localStorage.getItem(FONT_SIZE_KEY);
      if (storedSize === "sm" || storedSize === "md" || storedSize === "lg") {
        setFontSizeState(storedSize);
      }
    } catch {
      // ignore corrupted local storage
    }
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    function applyMode() {
      const isDark =
        colorMode === "dark" || (colorMode === "system" && mediaQuery.matches);
      document.documentElement.classList.toggle("dark", isDark);
    }

    applyMode();

    if (colorMode === "system") {
      mediaQuery.addEventListener("change", applyMode);
      return () => mediaQuery.removeEventListener("change", applyMode);
    }
  }, [colorMode]);

  useEffect(() => {
    document.documentElement.setAttribute("data-font-size", fontSize);
  }, [fontSize]);

  const setColorMode = useCallback((mode: ColorMode) => {
    setColorModeState(mode);
    try {
      window.localStorage.setItem(COLOR_MODE_KEY, mode);
    } catch {
      // ignore write failures (e.g. private browsing)
    }
  }, []);

  const setFontSize = useCallback((size: FontSize) => {
    setFontSizeState(size);
    try {
      window.localStorage.setItem(FONT_SIZE_KEY, size);
    } catch {
      // ignore write failures (e.g. private browsing)
    }
  }, []);

  const value = useMemo(
    () => ({
      colorMode,
      setColorMode,
      fontSize,
      setFontSize,
    }),
    [colorMode, setColorMode, fontSize, setFontSize]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
