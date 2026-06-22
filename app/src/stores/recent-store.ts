import { create } from "zustand";

const RECENTS_KEY = "editormd_recents";
const FAVORITES_KEY = "editormd_favorites";
const MAX_RECENTS = 15;

// Las listas se guardan por bóveda: { [vaultPath]: string[] }.
type VaultMap = Record<string, string[]>;

function loadMap(key: string): VaultMap {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as VaultMap) : {};
  } catch {
    return {};
  }
}

function saveMap(key: string, map: VaultMap) {
  localStorage.setItem(key, JSON.stringify(map));
}

interface RecentState {
  vaultPath: string | null;
  recents: string[];
  favorites: string[];

  loadForVault: (vaultPath: string) => void;
  addRecent: (vaultPath: string, path: string) => void;
  toggleFavorite: (path: string) => void;
  isFavorite: (path: string) => boolean;
}

export const useRecentStore = create<RecentState>((set, get) => ({
  vaultPath: null,
  recents: [],
  favorites: [],

  loadForVault: (vaultPath: string) => {
    const recents = loadMap(RECENTS_KEY)[vaultPath] ?? [];
    const favorites = loadMap(FAVORITES_KEY)[vaultPath] ?? [];
    set({ vaultPath, recents, favorites });
  },

  addRecent: (vaultPath: string, path: string) => {
    const map = loadMap(RECENTS_KEY);
    const current = map[vaultPath] ?? [];
    const next = [path, ...current.filter((p) => p !== path)].slice(0, MAX_RECENTS);
    map[vaultPath] = next;
    saveMap(RECENTS_KEY, map);
    if (get().vaultPath === vaultPath) set({ recents: next });
  },

  toggleFavorite: (path: string) => {
    const { vaultPath, favorites } = get();
    if (!vaultPath) return;
    const next = favorites.includes(path)
      ? favorites.filter((p) => p !== path)
      : [...favorites, path];
    const map = loadMap(FAVORITES_KEY);
    map[vaultPath] = next;
    saveMap(FAVORITES_KEY, map);
    set({ favorites: next });
  },

  isFavorite: (path: string) => get().favorites.includes(path),
}));
