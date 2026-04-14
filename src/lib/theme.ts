export type ThemeName = "dark" | "light" | "blue";

export const ThemeLabel: Record<ThemeName, string> = {
  dark: "Тёмная",
  light: "Светлая",
  blue: "Синяя",
};

export const THEME_STORAGE_KEY = "fg_theme";

