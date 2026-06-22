import * as Dialog from "@radix-ui/react-dialog";
import { X, Moon, Sun, Palette, BookOpen, Ghost, Skull } from "lucide-react";
import { useUIStore } from "@/stores/ui-store";
import { useSettingsStore } from "@/stores/settings-store";
import type { Theme } from "@/types";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const themeIcons: Record<Theme, React.ComponentType<{ className?: string }>> = {
  dark: Moon,
  light: Sun,
  sepia: BookOpen,
  pastel: Palette,
  dracula: Ghost,
  alucard: Skull,
};

const themePreviewColors: Record<Theme, { bg: string; fg: string; accent: string }> = {
  dark: { bg: "#1a1a2e", fg: "#e0e0e8", accent: "#7c6ff7" },
  light: { bg: "#fafafa", fg: "#1a1a2e", accent: "#5b4fd4" },
  sepia: { bg: "#f4ecd8", fg: "#433422", accent: "#8b6914" },
  pastel: { bg: "#f3eef8", fg: "#3a2e50", accent: "#9b7ed8" },
  dracula: { bg: "#282a36", fg: "#f8f8f2", accent: "#bd93f9" },
  alucard: { bg: "#f8f0f0", fg: "#2a1a28", accent: "#9b4dca" },
};

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const theme = useUIStore((s) => s.theme);
  const setTheme = useUIStore((s) => s.setTheme);
  const { t, locale, setLocale, autoSave, setAutoSave } = useSettingsStore();

  const themes: Theme[] = ["dark", "light", "sepia", "pastel", "dracula", "alucard"];
  const locales: { key: Locale; label: string }[] = [
    { key: "es", label: t.settings.spanish },
    { key: "en", label: t.settings.english },
  ];

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed z-50 inset-0 m-auto w-[520px] h-fit max-h-[85vh] overflow-y-auto rounded-lg border border-border bg-background shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <Dialog.Title className="text-base font-semibold">
              {t.settings.title}
            </Dialog.Title>
            <Dialog.Close className="rounded-sm p-1 opacity-70 hover:opacity-100 hover:bg-accent transition-colors">
              <X className="size-4" />
            </Dialog.Close>
          </div>

          <div className="p-5 space-y-6">
            {/* Appearance Section */}
            <section>
              <h3 className="text-sm font-semibold mb-1">{t.settings.appearance}</h3>
              <p className="text-xs text-muted-foreground mb-3">{t.settings.themeDescription}</p>
              <div className="grid grid-cols-6 gap-2">
                {themes.map((t_key) => {
                  const Icon = themeIcons[t_key];
                  const colors = themePreviewColors[t_key];
                  const isActive = theme === t_key;
                  return (
                    <button
                      key={t_key}
                      onClick={() => setTheme(t_key)}
                      className={cn(
                        "flex flex-col items-center gap-1.5 p-2 rounded-lg border-2 transition-all cursor-pointer",
                        isActive
                          ? "border-primary bg-accent"
                          : "border-transparent hover:border-border hover:bg-accent/50"
                      )}
                    >
                      <div
                        className="w-full aspect-[4/3] rounded-md flex items-center justify-center border border-border/50"
                        style={{ backgroundColor: colors.bg }}
                      >
                        <span style={{ color: colors.accent }}><Icon className="size-5" /></span>
                      </div>
                      <span className="text-xs font-medium">{t.themes[t_key]}</span>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Language Section */}
            <section>
              <h3 className="text-sm font-semibold mb-1">{t.settings.language}</h3>
              <p className="text-xs text-muted-foreground mb-3">{t.settings.languageDescription}</p>
              <div className="flex gap-2">
                {locales.map((loc) => (
                  <button
                    key={loc.key}
                    onClick={() => setLocale(loc.key)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-lg border-2 text-sm transition-all cursor-pointer",
                      locale === loc.key
                        ? "border-primary bg-accent font-medium"
                        : "border-transparent hover:border-border hover:bg-accent/50"
                    )}
                  >
                    <span className="uppercase text-xs font-bold text-muted-foreground">{loc.key}</span>
                    {loc.label}
                  </button>
                ))}
              </div>
            </section>

            {/* Editor Section */}
            <section>
              <h3 className="text-sm font-semibold mb-3">{t.settings.editor}</h3>
              <button
                onClick={() => setAutoSave(!autoSave)}
                className="flex items-center justify-between w-full text-left gap-4 cursor-pointer group"
              >
                <span>
                  <span className="block text-sm font-medium">{t.settings.autoSave}</span>
                  <span className="block text-xs text-muted-foreground">{t.settings.autoSaveDescription}</span>
                </span>
                <span
                  className={cn(
                    "relative h-5 w-9 shrink-0 rounded-full transition-colors",
                    autoSave ? "bg-primary" : "bg-border"
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-0.5 left-0.5 size-4 rounded-full bg-white transition-transform",
                      autoSave && "translate-x-4"
                    )}
                  />
                </span>
              </button>
            </section>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
