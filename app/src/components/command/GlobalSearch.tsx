import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Command } from "cmdk";
import { Search, FileText } from "lucide-react";
import { useUIStore } from "@/stores/ui-store";
import { useVaultStore } from "@/stores/vault-store";
import { useEditorStore } from "@/stores/editor-store";
import { useSettingsStore } from "@/stores/settings-store";
import { searchVault } from "@/lib/tauri";
import type { SearchResult } from "@/types";

const DEBOUNCE_MS = 200;

export function GlobalSearch() {
  const open = useUIStore((s) => s.globalSearchOpen);
  const setOpen = useUIStore((s) => s.setGlobalSearchOpen);
  const viewMode = useUIStore((s) => s.viewMode);
  const setViewMode = useUIStore((s) => s.setViewMode);
  const vaultPath = useVaultStore((s) => s.vaultPath);
  const openFile = useEditorStore((s) => s.openFile);
  const setRequestedLine = useEditorStore((s) => s.setRequestedLine);
  const t = useSettingsStore((s) => s.t);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);

  // Debounced search against the Rust backend (setState ocurre dentro del
  // callback async, no de forma síncrona en el cuerpo del efecto).
  useEffect(() => {
    if (!vaultPath || query.trim().length === 0) return;
    const id = setTimeout(async () => {
      try {
        setResults(await searchVault(vaultPath, query));
      } catch (err) {
        console.error("Error searching vault:", err);
        setResults([]);
      }
    }, DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [query, vaultPath]);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    if (value.trim().length === 0) setResults([]);
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      setQuery("");
      setResults([]);
    }
  };

  const openAt = (path: string, line?: number) => {
    if (!vaultPath) return;
    setOpen(false);
    // Saltar a una línea requiere el editor de código montado.
    if (line && viewMode === "wysiwyg") setViewMode("code");
    openFile(vaultPath, path).then(() => {
      if (line) setRequestedLine(line);
    });
  };

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-[12%] z-50 w-[620px] max-w-[90vw] -translate-x-1/2 overflow-hidden rounded-lg border border-border bg-background shadow-xl data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95">
          <Dialog.Title className="sr-only">{t.search.placeholder}</Dialog.Title>
          <Command shouldFilter={false} className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground">
            <div className="flex items-center gap-2 border-b border-border px-4">
              <Search className="size-4 shrink-0 text-muted-foreground" />
              <Command.Input
                autoFocus
                value={query}
                onValueChange={handleQueryChange}
                placeholder={t.search.placeholder}
                className="w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
            <Command.List className="max-h-[420px] overflow-y-auto p-2">
              {query.trim().length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  {t.search.typeToSearch}
                </div>
              ) : results.length === 0 ? (
                <Command.Empty className="py-8 text-center text-sm text-muted-foreground">
                  {t.search.noResults}
                </Command.Empty>
              ) : (
                results.map((res) => (
                  <Command.Group
                    key={res.path}
                    heading={
                      <span className="flex items-center gap-1.5">
                        <FileText className="size-3.5" />
                        {res.name}
                        {res.name_match && (
                          <span className="text-[10px] uppercase tracking-wide text-primary">
                            {t.search.inName}
                          </span>
                        )}
                      </span>
                    }
                  >
                    {res.matches.length === 0 ? (
                      <SearchItem
                        value={`${res.path}-name`}
                        text={res.path}
                        onSelect={() => openAt(res.path)}
                      />
                    ) : (
                      res.matches.map((m) => (
                        <SearchItem
                          key={`${res.path}-${m.line}`}
                          value={`${res.path}-${m.line}`}
                          line={m.line}
                          text={m.text}
                          onSelect={() => openAt(res.path, m.line)}
                        />
                      ))
                    )}
                  </Command.Group>
                ))
              )}
            </Command.List>
          </Command>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

interface SearchItemProps {
  value: string;
  text: string;
  line?: number;
  onSelect: () => void;
}

function SearchItem({ value, text, line, onSelect }: SearchItemProps) {
  return (
    <Command.Item
      value={value}
      onSelect={onSelect}
      className="flex items-center gap-3 rounded-md px-3 py-1.5 text-sm cursor-pointer data-[selected=true]:bg-accent"
    >
      {line != null && (
        <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{line}</span>
      )}
      <span className="truncate text-muted-foreground">{text}</span>
    </Command.Item>
  );
}
