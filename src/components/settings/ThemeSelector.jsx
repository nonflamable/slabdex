import { useState, useEffect } from "react";
import { Lock, Check } from "lucide-react";

const THEMES = [
  {
    id: "default",
    name: "Default",
    pro: false,
    light: { primary: "0 0% 4%", background: "0 0% 98%", accent: "0 0% 90%" },
    dark: { primary: "0 0% 98%", background: "0 0% 4%", accent: "0 0% 18%" },
    preview: ["#0a0a0a", "#f5f5f5", "#e5e5e5"],
  },
  {
    id: "ocean",
    name: "Ocean",
    pro: true,
    light: { primary: "210 80% 30%", background: "210 40% 97%", accent: "210 40% 88%" },
    dark: { primary: "210 80% 70%", background: "210 40% 8%", accent: "210 30% 20%" },
    preview: ["#1a4f8a", "#f0f5fc", "#c5d8f0"],
  },
  {
    id: "forest",
    name: "Forest",
    pro: true,
    light: { primary: "140 50% 25%", background: "140 20% 97%", accent: "140 20% 88%" },
    dark: { primary: "140 50% 65%", background: "140 20% 6%", accent: "140 20% 18%" },
    preview: ["#1e5c33", "#f0f8f2", "#c2dfc9"],
  },
  {
    id: "sunset",
    name: "Sunset",
    pro: true,
    light: { primary: "20 90% 40%", background: "20 30% 98%", accent: "20 30% 90%" },
    dark: { primary: "20 90% 65%", background: "20 15% 7%", accent: "20 20% 18%" },
    preview: ["#c45a10", "#fdf6f0", "#f5d5b8"],
  },
  {
    id: "violet",
    name: "Violet",
    pro: true,
    light: { primary: "270 60% 40%", background: "270 20% 98%", accent: "270 20% 90%" },
    dark: { primary: "270 60% 70%", background: "270 20% 7%", accent: "270 20% 18%" },
    preview: ["#6b30b8", "#f7f0ff", "#dcc8f8"],
  },
  {
    id: "rose",
    name: "Rose",
    pro: true,
    light: { primary: "345 70% 40%", background: "345 20% 98%", accent: "345 20% 90%" },
    dark: { primary: "345 70% 70%", background: "345 20% 7%", accent: "345 20% 18%" },
    preview: ["#a8204a", "#fff0f3", "#f8c8d4"],
  },
];

const THEME_KEY = "slabdex_theme";

export function applyTheme(themeId, isDark) {
  const theme = THEMES.find((t) => t.id === themeId) || THEMES[0];
  const vars = isDark ? theme.dark : theme.light;
  const root = document.documentElement;
  root.style.setProperty("--primary", vars.primary);
  root.style.setProperty("--primary-foreground", isDark ? "0 0% 4%" : "0 0% 98%");
  root.style.setProperty("--background", vars.background);
  root.style.setProperty("--foreground", isDark ? "0 0% 98%" : "0 0% 4%");
  root.style.setProperty("--accent", vars.accent);
  root.style.setProperty("--accent-foreground", isDark ? "0 0% 98%" : "0 0% 4%");
}

export default function ThemeSelector({ isPro = false, isDark = false }) {
  const [selected, setSelected] = useState(() => localStorage.getItem(THEME_KEY) || "default");

  useEffect(() => {
    applyTheme(selected, isDark);
  }, [isDark]);

  const handleSelect = (theme) => {
    if (theme.pro && !isPro) return;
    setSelected(theme.id);
    localStorage.setItem(THEME_KEY, theme.id);
    applyTheme(theme.id, isDark);
  };

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Theme</p>
      <div className="grid grid-cols-3 gap-3">
        {THEMES.map((theme) => {
          const locked = theme.pro && !isPro;
          const isSelected = selected === theme.id;
          return (
            <button
              key={theme.id}
              onClick={() => handleSelect(theme)}
              className={`relative rounded-2xl p-3 border-2 transition-all text-left ${
                isSelected ? "border-foreground" : "border-border"
              } ${locked ? "opacity-60" : "hover:border-foreground/50"} bg-card`}
            >
              {/* Color swatches */}
              <div className="flex gap-1 mb-2">
                {theme.preview.map((color, i) => (
                  <div
                    key={i}
                    className="h-4 rounded-full flex-1"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <p className="text-xs font-semibold">{theme.name}</p>

              {/* Lock icon */}
              {locked && (
                <div className="absolute top-2 right-2">
                  <Lock className="w-3 h-3 text-muted-foreground" />
                </div>
              )}

              {/* Check icon */}
              {isSelected && !locked && (
                <div className="absolute top-2 right-2 w-4 h-4 bg-foreground rounded-full flex items-center justify-center">
                  <Check className="w-2.5 h-2.5 text-background" />
                </div>
              )}

              {/* Pro badge */}
              {theme.pro && !isPro && (
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wide">Pro</span>
              )}
            </button>
          );
        })}
      </div>
      {!isPro && (
        <p className="text-xs text-muted-foreground mt-3 text-center">
          Upgrade to <span className="font-semibold text-foreground">SlabDex Pro</span> to unlock all themes
        </p>
      )}
    </div>
  );
}