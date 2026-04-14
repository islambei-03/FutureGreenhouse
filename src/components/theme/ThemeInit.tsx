"use client";

import { useEffect } from "react";
import { THEME_STORAGE_KEY, type ThemeName } from "@/lib/theme";

function applyTheme(theme: ThemeName) {
  const html = document.documentElement;
  if (theme === "dark") html.removeAttribute("data-theme");
  else html.setAttribute("data-theme", theme);
}

export default function ThemeInit() {
  useEffect(() => {
    const raw = localStorage.getItem(THEME_STORAGE_KEY);
    const theme = (raw === "light" || raw === "blue" || raw === "dark" ? raw : "dark") satisfies ThemeName;
    applyTheme(theme);
  }, []);

  return null;
}

