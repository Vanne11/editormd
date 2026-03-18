import { useState } from "react";
import { FileTree } from "@/components/file-tree/FileTree";
import { useVaultStore } from "@/stores/vault-store";
import { useEditorStore } from "@/stores/editor-store";
import { useUIStore } from "@/stores/ui-store";
import { useSettingsStore } from "@/stores/settings-store";
import { Vault, FolderOpen, Import, FileOutput, Settings, Check, AlertCircle } from "lucide-react";
import { open, save } from "@tauri-apps/plugin-dialog";
import { importFile, exportFile } from "@/lib/tauri";

export function Sidebar() {
  const vaultPath = useVaultStore((s) => s.vaultPath);
  const vaultInfo = useVaultStore((s) => s.vaultInfo);
  const setVaultPath = useVaultStore((s) => s.setVaultPath);
  const refreshFileTree = useVaultStore((s) => s.refreshFileTree);
  const openFile = useEditorStore((s) => s.openFile);
  const activeTab = useEditorStore((s) => s.tabs.find((t) => t.id === s.activeTabId));
  const sidebarWidth = useUIStore((s) => s.sidebarWidth);
  const sidebarVisible = useUIStore((s) => s.sidebarVisible);
  const setSettingsOpen = useUIStore((s) => s.setSettingsOpen);
  const t = useSettingsStore((s) => s.t);
  const [exportStatus, setExportStatus] = useState<"idle" | "success" | "error">("idle");

  const handleOpenVault = async () => {
    const selected = await open({ directory: true, multiple: false });
    if (selected && typeof selected === "string") {
      await setVaultPath(selected);
    }
  };

  const handleImport = async () => {
    if (!vaultPath) return;
    const selected = await open({
      multiple: true,
      filters: [
        { name: "Markdown", extensions: ["md", "markdown", "txt"] },
      ],
    });
    if (!selected) return;
    const files = Array.isArray(selected) ? selected : [selected];
    for (const filePath of files) {
      if (typeof filePath === "string") {
        try {
          const relativePath = await importFile(vaultPath, filePath);
          await refreshFileTree();
          await openFile(vaultPath, relativePath);
        } catch (e) {
          console.error("Error importing:", e);
        }
      }
    }
  };

  const handleExport = async () => {
    if (!vaultPath || !activeTab) return;
    const destPath = await save({
      defaultPath: activeTab.name,
      filters: [
        { name: "Markdown", extensions: ["md"] },
        { name: "Todos los archivos", extensions: ["*"] },
      ],
    });
    if (destPath && typeof destPath === "string") {
      try {
        await exportFile(vaultPath, activeTab.path, destPath);
        setExportStatus("success");
      } catch (e) {
        console.error("Error exporting:", e);
        setExportStatus("error");
      }
      setTimeout(() => setExportStatus("idle"), 2000);
    }
  };

  if (!sidebarVisible) return null;

  return (
    <div
      className="flex flex-col border-r border-border bg-sidebar h-full shrink-0"
      style={{ width: sidebarWidth }}
    >
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border">
        <Vault className="size-4 text-primary" />
        <span className="text-sm font-semibold truncate flex-1">
          {vaultInfo?.name ?? t.app.name}
        </span>
        <button
          className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground"
          onClick={handleOpenVault}
          title={t.sidebar.openVault}
        >
          <FolderOpen className="size-3.5" />
        </button>
      </div>
      <div className="flex-1 overflow-hidden">
        <FileTree />
      </div>
      <div className="flex items-center gap-1 px-3 py-2 border-t border-border">
        {vaultPath && (
          <>
            <button
              className="flex items-center gap-1.5 px-2 py-1 rounded text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              onClick={handleImport}
              title={t.sidebar.importFile}
            >
              <Import className="size-3.5" />
            </button>
            <button
              className="flex items-center gap-1.5 px-2 py-1 rounded text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors disabled:opacity-30"
              onClick={handleExport}
              disabled={!activeTab}
              title={t.sidebar.exportFile}
            >
              {exportStatus === "success" ? (
                <Check className="size-3.5 text-green-500" />
              ) : exportStatus === "error" ? (
                <AlertCircle className="size-3.5 text-destructive" />
              ) : (
                <FileOutput className="size-3.5" />
              )}
            </button>
          </>
        )}
        <div className="flex-1" />
        <button
          className="flex items-center gap-1.5 px-2 py-1 rounded text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          onClick={() => setSettingsOpen(true)}
          title={t.sidebar.settings}
        >
          <Settings className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
