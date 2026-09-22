import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext(null);
const STORAGE_KEY = "hostel-theme";

// localStorage throws in Safari private mode and under some locked-down
// Windows/enterprise browser policies. Losing the saved theme is harmless;
// taking the whole app down with an uncaught exception is not.
function readStoredTheme() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "light" || saved === "dark") return saved;
  } catch {
    /* storage unavailable — fall through to the system preference */
  }
  try {
    if (window.matchMedia?.("(prefers-color-scheme: dark)").matches) return "dark";
  } catch {
    /* matchMedia unavailable — fall through to light */
  }
  return "light";
}

function persistTheme(theme) {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    /* non-fatal: the theme simply won't persist across reloads */
  }
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    if (typeof window === "undefined") return "light";
    return readStoredTheme();
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    // Keeps the mobile browser chrome (address bar / status bar) in step
    // with the page, which is the difference between a polished app and an
    // obviously-themed web page on a phone.
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", theme === "dark" ? "#0f1622" : "#0e1b2c");
    persistTheme(theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  }

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
