import { useMemo } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Command } from "cmdk";
import { FilePlus, Search, Palette, Settings, PanelLeft } from "lucide-react";
import { useUIStore } from "@/stores/ui-store";
import { useVaultStore } from "@/stores/vault-store";
import { useEditorStore } from "@/stores/editor-store";
import { useSettingsStore } from "@/stores/settings-store";
import { flattenFiles, isEditableFile, getFileIcon } from "@/lib/file-utils";
import { createFile } from "@/lib/tauri";
import type { Theme } from "@/types";

const themeOrder: Theme[] = ["dark", "light", "sepia", "pastel", "dracula", "alucard"];

export function CommandPalette() {
  const open = useUIStore((s) => s.commandPaletteOpen);
  const setOpen = useUIStore((s) => s.setCommandPaletteOpen);
  const setGlobalSearchOpen = useUIStore((s) => s.setGlobalSearchOpen);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const setSettingsOpen = useUIStore((s) => s.setSettingsOpen);
  const theme = useUIStore((s) => s.theme);
  const setTheme = useUIStore((s) => s.setTheme);
  const vaultPath = useVaultStore((s) => s.vaultPath);
  const fileTree = useVaultStore((s) => s.fileTree);
  const refreshFileTree = useVaultStore((s) => s.refreshFileTree);
  const openFile = useEditorStore((s) => s.openFile);
  const t = useSettingsStore((s) => s.t);

  const files = useMemo(
    () => flattenFiles(fileTree).filter((f) => isEditableFile(f.file_type)),
    [fileTree]
  );

  const run = (fn: () => void) => {
    setOpen(false);
    fn();
  };

  const cycleTheme = () => {
    const idx = themeOrder.indexOf(theme);
    setTheme(themeOrder[(idx + 1) % themeOrder.length]);
  };

  const newNote = async () => {
    if (!vaultPath) return;
    const name = `nota-${Date.now()}.md`;
    try {
      await createFile(vaultPath, name);
      await refreshFileTree();
      await openFile(vaultPath, name);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-[15%] z-50 w-[560px] max-w-[90vw] -translate-x-1/2 overflow-hidden rounded-lg border border-border bg-background shadow-xl data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95">
          <Dialog.Title className="sr-only">{t.command.placeholder}</Dialog.Title>
          <Command className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground">
            <Command.Input
              autoFocus
              placeholder={t.command.placeholder}
              className="w-full border-b border-border bg-transparent px-4 py-3 text-sm outline-none placeholder:text-muted-foreground"
            />
            <Command.List className="max-h-[360px] overflow-y-auto p-2">
              <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
                {t.command.noResults}
              </Command.Empty>

              <Command.Group heading={t.command.commands}>
                <PaletteItem icon={FilePlus} label={t.command.newNote} onSelect={() => run(newNote)} disabled={!vaultPath} />
                <PaletteItem icon={Search} label={t.command.globalSearch} onSelect={() => run(() => setGlobalSearchOpen(true))} />
                <PaletteItem icon={Palette} label={t.command.cycleTheme} onSelect={() => run(cycleTheme)} />
                <PaletteItem icon={PanelLeft} label={t.command.toggleSidebar} onSelect={() => run(toggleSidebar)} />
                <PaletteItem icon={Settings} label={t.command.openSettings} onSelect={() => run(() => setSettingsOpen(true))} />
              </Command.Group>

              {files.length > 0 && (
                <Command.Group heading={t.command.notes}>
                  {files.map((file) => {
                    const Icon = getFileIcon(file.file_type);
                    return (
                      <PaletteItem
                        key={file.path}
                        icon={Icon}
                        label={file.name}
                        hint={file.path}
                        value={`${file.name} ${file.path}`}
                        onSelect={() => run(() => vaultPath && openFile(vaultPath, file.path))}
                      />
                    );
                  })}
                </Command.Group>
              )}
            </Command.List>
          </Command>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

interface PaletteItemProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  hint?: string;
  value?: string;
  disabled?: boolean;
  onSelect: () => void;
}

function PaletteItem({ icon: Icon, label, hint, value, disabled, onSelect }: PaletteItemProps) {
  return (
    <Command.Item
      value={value ?? label}
      disabled={disabled}
      onSelect={onSelect}
      className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm cursor-pointer data-[selected=true]:bg-accent data-[disabled=true]:opacity-40 data-[disabled=true]:cursor-not-allowed"
    >
      <Icon className="size-4 shrink-0 text-muted-foreground" />
      <span className="truncate">{label}</span>
      {hint && <span className="ml-auto truncate text-xs text-muted-foreground">{hint}</span>}
    </Command.Item>
  );
}
