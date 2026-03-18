import { create } from "zustand";
import type { FileEntry, VaultInfo } from "@/types";
import { getFileTree, getVaultInfo } from "@/lib/tauri";

interface VaultState {
  vaultPath: string | null;
  vaultInfo: VaultInfo | null;
  fileTree: FileEntry[];
  isLoading: boolean;

  setVaultPath: (path: string) => Promise<void>;
  refreshFileTree: () => Promise<void>;
  clearVault: () => void;
}

export const useVaultStore = create<VaultState>((set, get) => ({
  vaultPath: null,
  vaultInfo: null,
  fileTree: [],
  isLoading: false,

  setVaultPath: async (path: string) => {
    set({ isLoading: true });
    try {
      const [info, tree] = await Promise.all([
        getVaultInfo(path),
        getFileTree(path),
      ]);
      set({ vaultPath: path, vaultInfo: info, fileTree: tree, isLoading: false });
      localStorage.setItem("editormd_last_vault", path);
    } catch (e) {
      console.error("Error opening vault:", e);
      set({ isLoading: false });
    }
  },

  refreshFileTree: async () => {
    const { vaultPath } = get();
    if (!vaultPath) return;
    try {
      const tree = await getFileTree(vaultPath);
      set({ fileTree: tree });
    } catch (e) {
      console.error("Error refreshing file tree:", e);
    }
  },

  clearVault: () => {
    set({ vaultPath: null, vaultInfo: null, fileTree: [] });
    localStorage.removeItem("editormd_last_vault");
  },
}));
