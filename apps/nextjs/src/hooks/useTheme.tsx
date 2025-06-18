import { useEffect, useState } from "react";

import { supabase } from "../integrations/supabase/client";
import { useAuth } from "./useAuth";

export const useTheme = () => {
  const { user } = useAuth();
  const [theme, setTheme] = useState("modern");

  useEffect(() => {
    if (!user) return;

    const fetchTheme = async () => {
      const { data } = await supabase
        .from("user_profiles")
        .select("selected_theme")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data?.selected_theme) {
        const selectedTheme = data.selected_theme;
        setTheme(selectedTheme);
        // Small delay to ensure next-themes has initialized
        setTimeout(() => applyTheme(selectedTheme), 100);
      } else {
        // Apply default theme if no theme is saved
        setTimeout(() => applyTheme("modern"), 100);
      }
    };

    fetchTheme();
  }, [user]);

  // Apply theme whenever it changes
  useEffect(() => {
    if (theme) {
      // Small delay to ensure next-themes has initialized
      setTimeout(() => applyTheme(theme), 100);
    }
  }, [theme]);

  // Watch for dark/light mode changes and reapply theme
  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === "attributes" &&
          mutation.attributeName === "class"
        ) {
          const target = mutation.target as HTMLElement;
          if (
            target.classList.contains("dark") ||
            target.classList.contains("light")
          ) {
            // Reapply our custom theme when dark/light mode changes
            setTimeout(() => applyTheme(theme), 50);
          }
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, [theme]);

  const applyTheme = (selectedTheme: string) => {
    const root = document.documentElement;
    const isDark = root.classList.contains("dark");

    const themeColors = {
      modern: {
        light: {
          primary: "#0f172a",
          background: "#ffffff",
          foreground: "#0f172a",
          accent: "#f1f5f9",
          secondary: "#f1f5f9",
          muted: "#f8fafc",
          card: "#ffffff",
          border: "#e2e8f0",
        },
        dark: {
          primary: "#f8fafc",
          background: "#0f172a",
          foreground: "#f8fafc",
          accent: "#1e293b",
          secondary: "#1e293b",
          muted: "#334155",
          card: "#1e293b",
          border: "#334155",
        },
      },
      calming: {
        light: {
          primary: "#0369a1",
          background: "#f0f9ff",
          foreground: "#0c4a6e",
          accent: "#e0f2fe",
          secondary: "#bae6fd",
          muted: "#f0f9ff",
          card: "#ffffff",
          border: "#7dd3fc",
        },
        dark: {
          primary: "#7dd3fc",
          background: "#0c4a6e",
          foreground: "#f0f9ff",
          accent: "#075985",
          secondary: "#0369a1",
          muted: "#164e63",
          card: "#075985",
          border: "#0284c7",
        },
      },
      grass: {
        light: {
          primary: "#15803d",
          background: "#f0fdf4",
          foreground: "#14532d",
          accent: "#dcfce7",
          secondary: "#bbf7d0",
          muted: "#f0fdf4",
          card: "#ffffff",
          border: "#4ade80",
        },
        dark: {
          primary: "#4ade80",
          background: "#14532d",
          foreground: "#f0fdf4",
          accent: "#166534",
          secondary: "#15803d",
          muted: "#16a34a",
          card: "#166534",
          border: "#22c55e",
        },
      },
      girly: {
        light: {
          primary: "#be185d",
          background: "#fdf2f8",
          foreground: "#831843",
          accent: "#fce7f3",
          secondary: "#f9a8d4",
          muted: "#fdf2f8",
          card: "#ffffff",
          border: "#f472b6",
        },
        dark: {
          primary: "#f9a8d4",
          background: "#831843",
          foreground: "#fdf2f8",
          accent: "#be185d",
          secondary: "#ec4899",
          muted: "#a21caf",
          card: "#be185d",
          border: "#f472b6",
        },
      },
    };

    const themeConfig = themeColors[selectedTheme as keyof typeof themeColors];
    if (themeConfig) {
      const colors = isDark ? themeConfig.dark : themeConfig.light;

      // Apply colors with higher specificity to override next-themes
      Object.entries(colors).forEach(([key, value]) => {
        const hslColor = hexToHsl(value);
        // Use !important to ensure our colors override the default theme
        root.style.setProperty(
          `--${key}`,
          `${hslColor.h} ${hslColor.s}% ${hslColor.l}%`,
          "important",
        );
      });

      // Set foreground colors with higher specificity
      root.style.setProperty(
        "--primary-foreground",
        isDark ? "0 0% 100%" : "0 0% 0%",
        "important",
      );
      root.style.setProperty(
        "--secondary-foreground",
        isDark ? "0 0% 100%" : "0 0% 0%",
        "important",
      );
      root.style.setProperty(
        "--accent-foreground",
        isDark ? "0 0% 100%" : "0 0% 0%",
        "important",
      );
      root.style.setProperty(
        "--muted-foreground",
        isDark ? "0 0% 70%" : "0 0% 40%",
        "important",
      );
      root.style.setProperty(
        "--card-foreground",
        isDark ? "0 0% 100%" : "0 0% 0%",
        "important",
      );
    }
  };

  const hexToHsl = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0,
      s = 0,
      l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }
      h /= 6;
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100),
    };
  };

  return { theme, applyTheme, setTheme };
};
