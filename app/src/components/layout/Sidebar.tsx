import { FileTree } from "@/components/file-tree/FileTree";
import { useVaultStore } from "@/stores/vault-store";
import { useUIStore } from "@/stores/ui-store";
import { useSettingsStore } from "@/stores/settings-store";
import { Vault, FolderOpen } from "lucide-react";
import { open } from "@tauri-apps/plugin-dialog";

export function Sidebar() {
  const vaultInfo = useVaultStore((s) => s.vaultInfo);
  const setVaultPath = useVaultStore((s) => s.setVaultPath);
  const sidebarWidth = useUIStore((s) => s.sidebarWidth);
  const sidebarVisible = useUIStore((s) => s.sidebarVisible);
  const t = useSettingsStore((s) => s.t);

  const handleOpenVault = async () => {
    const selected = await open({ directory: true, multiple: false });
    if (selected && typeof selected === "string") {
      await setVaultPath(selected);
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
    </div>
  );
}
