import { create } from "zustand";
import type { EditorView } from "@codemirror/view";
import type { Tab } from "@/types";
import { readFile, writeFile } from "@/lib/tauri";
import { getFileName } from "@/lib/utils";

interface EditorState {
  tabs: Tab[];
  activeTabId: string | null;
  cursorLine: number;
  cursorCol: number;
  editorView: EditorView | null;

  openFile: (vaultPath: string, filePath: string) => Promise<void>;
  closeTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;
  updateContent: (tabId: string, content: string) => void;
  saveTab: (vaultPath: string, tabId: string) => Promise<void>;
  saveActiveTab: (vaultPath: string) => Promise<void>;
  setCursor: (line: number, col: number) => void;
  getActiveTab: () => Tab | undefined;
  setEditorView: (view: EditorView | null) => void;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  tabs: [],
  activeTabId: null,
  cursorLine: 1,
  cursorCol: 1,
  editorView: null,

  openFile: async (vaultPath: string, filePath: string) => {
    const { tabs } = get();
    const existing = tabs.find((t) => t.path === filePath);
    if (existing) {
      set({ activeTabId: existing.id });
      return;
    }

    try {
      const content = await readFile(vaultPath, filePath);
      const id = crypto.randomUUID();
      const tab: Tab = {
        id,
        path: filePath,
        name: getFileName(filePath),
        content,
        isDirty: false,
      };
      set((state) => ({
        tabs: [...state.tabs, tab],
        activeTabId: id,
      }));
    } catch (e) {
      console.error("Error opening file:", e);
    }
  },

  closeTab: (tabId: string) => {
    set((state) => {
      const idx = state.tabs.findIndex((t) => t.id === tabId);
      const newTabs = state.tabs.filter((t) => t.id !== tabId);
      let newActive = state.activeTabId;
      if (state.activeTabId === tabId) {
        if (newTabs.length > 0) {
          const newIdx = Math.min(idx, newTabs.length - 1);
          newActive = newTabs[newIdx].id;
        } else {
          newActive = null;
        }
      }
      return { tabs: newTabs, activeTabId: newActive };
    });
  },

  setActiveTab: (tabId: string) => {
    set({ activeTabId: tabId });
  },

  updateContent: (tabId: string, content: string) => {
    set((state) => ({
      tabs: state.tabs.map((t) =>
        t.id === tabId ? { ...t, content, isDirty: true } : t
      ),
    }));
  },

  saveTab: async (vaultPath: string, tabId: string) => {
    const tab = get().tabs.find((t) => t.id === tabId);
    if (!tab) return;
    try {
      await writeFile(vaultPath, tab.path, tab.content);
      set((state) => ({
        tabs: state.tabs.map((t) =>
          t.id === tabId ? { ...t, isDirty: false } : t
        ),
      }));
    } catch (e) {
      console.error("Error saving file:", e);
    }
  },

  saveActiveTab: async (vaultPath: string) => {
    const { activeTabId } = get();
    if (activeTabId) {
      await get().saveTab(vaultPath, activeTabId);
    }
  },

  setCursor: (line: number, col: number) => {
    set({ cursorLine: line, cursorCol: col });
  },

  getActiveTab: () => {
    const { tabs, activeTabId } = get();
    return tabs.find((t) => t.id === activeTabId);
  },

  setEditorView: (view) => {
    set({ editorView: view });
  },
}));
