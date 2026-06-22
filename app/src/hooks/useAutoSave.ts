import { useEffect, useRef } from "react";
import { useEditorStore } from "@/stores/editor-store";
import { useVaultStore } from "@/stores/vault-store";
import { useSettingsStore } from "@/stores/settings-store";

const AUTOSAVE_DELAY = 1500;

/**
 * Guarda automáticamente las pestañas con cambios sin guardar tras un
 * periodo de inactividad (debounce). Se reinicia el temporizador con cada
 * cambio en la pestaña activa o al cambiar de pestaña, de modo que al
 * cambiar de nota la anterior también se persiste.
 */
export function useAutoSave() {
  const autoSave = useSettingsStore((s) => s.autoSave);
  const vaultPath = useVaultStore((s) => s.vaultPath);
  const activeTab = useEditorStore((s) =>
    s.tabs.find((t) => t.id === s.activeTabId)
  );
  const saveAllDirtyTabs = useEditorStore((s) => s.saveAllDirtyTabs);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const tabId = activeTab?.id;
  const content = activeTab?.content;
  const isDirty = activeTab?.isDirty;

  useEffect(() => {
    if (!autoSave || !vaultPath || !isDirty) return;
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      saveAllDirtyTabs(vaultPath);
    }, AUTOSAVE_DELAY);
    return () => clearTimeout(timerRef.current);
  }, [autoSave, vaultPath, tabId, content, isDirty, saveAllDirtyTabs]);
}
