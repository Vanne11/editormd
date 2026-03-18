import { useEditorStore } from "@/stores/editor-store";
import { useUIStore } from "@/stores/ui-store";
import { useSettingsStore } from "@/stores/settings-store";
import { countWords, countChars } from "@/lib/utils";
import { Moon, Sun, Palette, BookOpen, Skull, Globe, Settings } from "lucide-react";
import type { Theme } from "@/types";
import type { Locale } from "@/lib/i18n";

const themeIcons: Record<Theme, React.ComponentType<{ className?: string }>> = {
  dark: Moon,
  light: Sun,
  pastel: Palette,
  sepia: BookOpen,
  alucard: Skull,
};

const themeOrder: Theme[] = ["dark", "light", "pastel", "sepia", "alucard"];

export function StatusBar() {
  const activeTab = useEditorStore((s) => s.tabs.find((t) => t.id === s.activeTabId));
  const cursorLine = useEditorStore((s) => s.cursorLine);
  const cursorCol = useEditorStore((s) => s.cursorCol);
  const theme = useUIStore((s) => s.theme);
  const setTheme = useUIStore((s) => s.setTheme);
  const setSettingsOpen = useUIStore((s) => s.setSettingsOpen);
  const { t, locale, setLocale } = useSettingsStore();

  const cycleTheme = () => {
    const idx = themeOrder.indexOf(theme);
    setTheme(themeOrder[(idx + 1) % themeOrder.length]);
  };

  const cycleLocale = () => {
    const locales: Locale[] = ["es", "en"];
    const idx = locales.indexOf(locale);
    setLocale(locales[(idx + 1) % locales.length]);
  };

  const words = activeTab ? countWords(activeTab.content) : 0;
  const chars = activeTab ? countChars(activeTab.content) : 0;
  const ThemeIcon = themeIcons[theme];

  return (
    <div className="flex items-center justify-between px-3 py-1 border-t border-border bg-background text-xs text-muted-foreground select-none">
      <div className="flex items-center gap-4">
        <span>
          {t.statusBar.line} {cursorLine}, {t.statusBar.col} {cursorCol}
        </span>
        {activeTab && (
          <>
            <span>{words} {t.statusBar.words}</span>
            <span>{chars} {t.statusBar.chars}</span>
          </>
        )}
      </div>
      <div className="flex items-center gap-3">
        {activeTab?.isDirty && (
          <span className="text-yellow-500">{t.statusBar.unsaved}</span>
        )}
        <button
          className="flex items-center gap-1 hover:text-foreground transition-colors"
          onClick={cycleTheme}
        >
          <ThemeIcon className="size-3" />
          {t.themes[theme]}
        </button>
        <button
          className="flex items-center gap-1 hover:text-foreground transition-colors uppercase"
          onClick={cycleLocale}
        >
          <Globe className="size-3" />
          {locale}
        </button>
        <button
          className="flex items-center gap-1 hover:text-foreground transition-colors"
          onClick={() => setSettingsOpen(true)}
        >
          <Settings className="size-3" />
        </button>
        <span>{t.statusBar.markdown}</span>
      </div>
    </div>
  );
}
