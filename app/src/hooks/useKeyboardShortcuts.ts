import { useEffect } from "react";
import { useEditorStore } from "@/stores/editor-store";
import { useVaultStore } from "@/stores/vault-store";
import { useUIStore } from "@/stores/ui-store";
import { open } from "@tauri-apps/plugin-dialog";
import { createFile } from "@/lib/tauri";

export function useKeyboardShortcuts() {
  const vaultPath = useVaultStore((s) => s.vaultPath);
  const setVaultPath = useVaultStore((s) => s.setVaultPath);
  const refreshFileTree = useVaultStore((s) => s.refreshFileTree);
  const saveActiveTab = useEditorStore((s) => s.saveActiveTab);
  const openFile = useEditorStore((s) => s.openFile);
  const setViewMode = useUIStore((s) => s.setViewMode);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const toggleCommandPalette = useUIStore((s) => s.toggleCommandPalette);
  const toggleGlobalSearch = useUIStore((s) => s.toggleGlobalSearch);
  const settingsOpen = useUIStore((s) => s.settingsOpen);
  const setSettingsOpen = useUIStore((s) => s.setSettingsOpen);

  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;

      // Ctrl+S - Save
      if (ctrl && e.key === "s") {
        e.preventDefault();
        if (vaultPath) {
          await saveActiveTab(vaultPath);
        }
        return;
      }

      // Ctrl+O - Open vault
      if (ctrl && e.key === "o") {
        e.preventDefault();
        const selected = await open({ directory: true, multiple: false });
        if (selected && typeof selected === "string") {
          await setVaultPath(selected);
        }
        return;
      }

      // Ctrl+N - New note
      if (ctrl && e.key === "n") {
        e.preventDefault();
        if (!vaultPath) return;
        const name = `nota-${Date.now()}.md`;
        try {
          await createFile(vaultPath, name);
          await refreshFileTree();
          await openFile(vaultPath, name);
        } catch (err) {
          console.error(err);
        }
        return;
      }

      // Ctrl+Shift+F - Global search (must come before single-key checks)
      if (ctrl && e.shiftKey && e.key.toLowerCase() === "f") {
        e.preventDefault();
        toggleGlobalSearch();
        return;
      }

      // Ctrl+P - Command palette
      if (ctrl && e.key === "p") {
        e.preventDefault();
        toggleCommandPalette();
        return;
      }

      // Ctrl+1 - WYSIWYG
      if (ctrl && e.key === "1") {
        e.preventDefault();
        setViewMode("wysiwyg");
        return;
      }

      // Ctrl+2 - Split (code + preview)
      if (ctrl && e.key === "2") {
        e.preventDefault();
        setViewMode("split");
        return;
      }

      // Ctrl+3 - Code
      if (ctrl && e.key === "3") {
        e.preventDefault();
        setViewMode("code");
        return;
      }

      // Ctrl+B - Toggle sidebar
      if (ctrl && e.key === "b") {
        e.preventDefault();
        toggleSidebar();
        return;
      }

      // Ctrl+, - Settings
      if (ctrl && e.key === ",") {
        e.preventDefault();
        setSettingsOpen(!settingsOpen);
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    vaultPath,
    saveActiveTab,
    setVaultPath,
    refreshFileTree,
    openFile,
    setViewMode,
    toggleSidebar,
    toggleCommandPalette,
    toggleGlobalSearch,
    settingsOpen,
    setSettingsOpen,
  ]);
}
