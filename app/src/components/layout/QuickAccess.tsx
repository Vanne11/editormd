import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { useVaultStore } from "@/stores/vault-store";
import { useEditorStore } from "@/stores/editor-store";
import { useRecentStore } from "@/stores/recent-store";
import { useSettingsStore } from "@/stores/settings-store";
import { flattenFiles, getFileIcon } from "@/lib/file-utils";
import type { FileEntry } from "@/types";

export function QuickAccess() {
  const vaultPath = useVaultStore((s) => s.vaultPath);
  const fileTree = useVaultStore((s) => s.fileTree);
  const recents = useRecentStore((s) => s.recents);
  const favorites = useRecentStore((s) => s.favorites);
  const toggleFavorite = useRecentStore((s) => s.toggleFavorite);
  const t = useSettingsStore((s) => s.t);

  // Mapa ruta → entrada para resolver icono/nombre y descartar rutas obsoletas.
  const fileMap = useMemo(() => {
    const map = new Map<string, FileEntry>();
    for (const f of flattenFiles(fileTree)) map.set(f.path, f);
    return map;
  }, [fileTree]);

  const favoriteEntries = favorites
    .map((p) => fileMap.get(p))
    .filter((f): f is FileEntry => !!f);

  const favoriteSet = new Set(favorites);
  const recentEntries = recents
    .filter((p) => !favoriteSet.has(p))
    .map((p) => fileMap.get(p))
    .filter((f): f is FileEntry => !!f)
    .slice(0, 8);

  if (!vaultPath || (favoriteEntries.length === 0 && recentEntries.length === 0)) {
    return null;
  }

  return (
    <div className="border-b border-border shrink-0 max-h-[40%] overflow-y-auto">
      {favoriteEntries.length > 0 && (
        <Section title={t.sidebar.favorites} entries={favoriteEntries} toggleFavorite={toggleFavorite} />
      )}
      {recentEntries.length > 0 && (
        <Section title={t.sidebar.recent} entries={recentEntries} toggleFavorite={toggleFavorite} />
      )}
    </div>
  );
}

interface SectionProps {
  title: string;
  entries: FileEntry[];
  toggleFavorite: (path: string) => void;
}

function Section({ title, entries, toggleFavorite }: SectionProps) {
  const [open, setOpen] = useState(true);
  const vaultPath = useVaultStore((s) => s.vaultPath);
  const openFile = useEditorStore((s) => s.openFile);
  const activeTabPath = useEditorStore((s) => {
    const tab = s.tabs.find((t) => t.id === s.activeTabId);
    return tab?.path;
  });
  const favorites = useRecentStore((s) => s.favorites);
  const t = useSettingsStore((s) => s.t);

  return (
    <div className="py-1">
      <button
        className="flex items-center gap-1 w-full px-2 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground"
        onClick={() => setOpen(!open)}
      >
        {open ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
        {title}
      </button>
      {open &&
        entries.map((entry) => {
          const Icon = getFileIcon(entry.file_type);
          const isActive = activeTabPath === entry.path;
          const isFav = favorites.includes(entry.path);
          return (
            <div
              key={entry.path}
              className={cn(
                "group flex items-center gap-1.5 px-2 py-0.5 pl-5 text-sm cursor-pointer select-none rounded-sm hover:bg-accent/50",
                isActive && "bg-accent text-accent-foreground"
              )}
              onClick={() => vaultPath && openFile(vaultPath, entry.path)}
              title={entry.path}
            >
              <Icon className="size-3.5 shrink-0 text-muted-foreground" />
              <span className="truncate flex-1">{entry.name}</span>
              <button
                className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-accent"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFavorite(entry.path);
                }}
                title={isFav ? t.sidebar.removeFavorite : t.sidebar.addFavorite}
              >
                <Star
                  className={cn(
                    "size-3",
                    isFav ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground"
                  )}
                />
              </button>
            </div>
          );
        })}
    </div>
  );
}
