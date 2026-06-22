import { resolveWikilink, wikilinkToNewPath } from "@/lib/wikilink";
import { useVaultStore } from "@/stores/vault-store";
import { useEditorStore } from "@/stores/editor-store";
import { createFile } from "@/lib/tauri";

/**
 * Abre la nota destino de un wikilink; si no existe, la crea y la abre.
 * Lee el estado de los stores para poder invocarse desde handlers no-React
 * (node views, plugins de ProseMirror, preview).
 */
export async function navigateWikilink(target: string): Promise<void> {
  const trimmed = target.trim();
  if (!trimmed) return;

  const { vaultPath, fileTree, refreshFileTree } = useVaultStore.getState();
  if (!vaultPath) return;
  const openFile = useEditorStore.getState().openFile;

  const resolved = resolveWikilink(trimmed, fileTree);
  if (resolved) {
    openFile(vaultPath, resolved);
    return;
  }

  const newPath = wikilinkToNewPath(trimmed);
  try {
    await createFile(vaultPath, newPath);
    await refreshFileTree();
    await openFile(vaultPath, newPath);
  } catch (e) {
    console.error("Error creating wikilink note:", e);
  }
}
