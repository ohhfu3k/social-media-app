import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type ThemeMode = "light" | "dark" | "dragon";

interface AppState {
  theme: ThemeMode;
  setTheme: (t: ThemeMode) => void;
  anonymous: boolean;
  setAnonymous: (v: boolean) => void;
  twoFactor: boolean;
  setTwoFactor: (v: boolean) => void;
}

const AppStateContext = createContext<AppState | null>(null);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem("galaxy-theme");
    if (saved === "dark" || saved === "dragon" || saved === "light") return saved;
    return "dark";
  });
  const [anonymous, setAnonymous] = useState<boolean>(() => {
    const saved = localStorage.getItem("galaxy-anon");
    return saved === "1";
  });
  const [twoFactor, setTwoFactor] = useState<boolean>(() => {
    const saved = localStorage.getItem("galaxy-2fa");
    return saved === "1";
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("dark", "dragon");
    if (theme === "dark") root.classList.add("dark");
    if (theme === "dragon") root.classList.add("dragon");
    localStorage.setItem("galaxy-theme", theme);
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    if (anonymous) root.classList.add('anon'); else root.classList.remove('anon');
  }, [anonymous]);

  useEffect(() => {
    localStorage.setItem("galaxy-anon", anonymous ? "1" : "0");
  }, [anonymous]);

  useEffect(() => {
    localStorage.setItem("galaxy-2fa", twoFactor ? "1" : "0");
  }, [twoFactor]);

  const value = useMemo(
    () => ({ theme, setTheme: setThemeState, anonymous, setAnonymous, twoFactor, setTwoFactor }),
    [theme, anonymous, twoFactor]
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error("useAppState must be used within AppStateProvider");
  return ctx;
}
