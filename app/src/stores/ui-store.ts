import { create } from "zustand";
import type { ViewMode, Theme } from "@/types";

interface UIState {
  sidebarWidth: number;
  sidebarVisible: boolean;
  viewMode: ViewMode;
  theme: Theme;
  commandPaletteOpen: boolean;
  settingsOpen: boolean;

  setSidebarWidth: (width: number) => void;
  toggleSidebar: () => void;
  setViewMode: (mode: ViewMode) => void;
  setTheme: (theme: Theme) => void;
  toggleCommandPalette: () => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setSettingsOpen: (open: boolean) => void;
}

const savedTheme = (localStorage.getItem("editormd_theme") as Theme) || "dark";

export const useUIStore = create<UIState>((set) => ({
  sidebarWidth: 260,
  sidebarVisible: true,
  viewMode: "split",
  theme: savedTheme,
  commandPaletteOpen: false,
  settingsOpen: false,

  setSidebarWidth: (width: number) => set({ sidebarWidth: width }),

  toggleSidebar: () =>
    set((state) => ({ sidebarVisible: !state.sidebarVisible })),

  setViewMode: (mode: ViewMode) => set({ viewMode: mode }),

  setTheme: (theme: Theme) => {
    localStorage.setItem("editormd_theme", theme);
    set({ theme });
  },

  toggleCommandPalette: () =>
    set((state) => ({ commandPaletteOpen: !state.commandPaletteOpen })),

  setCommandPaletteOpen: (open: boolean) => set({ commandPaletteOpen: open }),

  setSettingsOpen: (open: boolean) => set({ settingsOpen: open }),
}));
