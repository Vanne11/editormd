import { X, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEditorStore } from "@/stores/editor-store";
import { useVaultStore } from "@/stores/vault-store";
import { useSettingsStore } from "@/stores/settings-store";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { ask } from "@tauri-apps/plugin-dialog";
import type { Tab } from "@/types";

export function EditorTabs() {
  const tabs = useEditorStore((s) => s.tabs);
  const activeTabId = useEditorStore((s) => s.activeTabId);
  const setActiveTab = useEditorStore((s) => s.setActiveTab);
  const closeTab = useEditorStore((s) => s.closeTab);
  const saveTab = useEditorStore((s) => s.saveTab);
  const vaultPath = useVaultStore((s) => s.vaultPath);
  const t = useSettingsStore((s) => s.t);

  const handleClose = async (tab: Tab) => {
    if (!tab.isDirty) {
      closeTab(tab.id);
      return;
    }
    const message = t.statusBar.unsavedMessage.replace("{{name}}", tab.name);
    const shouldSave = await ask(message, {
      title: t.statusBar.unsavedTitle,
      kind: "warning",
      okLabel: t.statusBar.save,
      cancelLabel: t.statusBar.discard,
    });
    if (shouldSave && vaultPath) {
      await saveTab(vaultPath, tab.id);
    }
    closeTab(tab.id);
  };

  if (tabs.length === 0) return null;

  return (
    <ScrollArea className="border-b border-border">
      <div className="flex">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 text-sm cursor-pointer border-r border-border select-none group min-w-0",
              "hover:bg-accent/50",
              activeTabId === tab.id
                ? "bg-background text-foreground border-b-2 border-b-primary"
                : "bg-muted/30 text-muted-foreground"
            )}
            onClick={() => setActiveTab(tab.id)}
          >
            <FileText className="size-3.5 shrink-0" />
            <span className="truncate max-w-[120px]">{tab.name}</span>
            {tab.isDirty && (
              <span className="size-2 rounded-full bg-primary shrink-0" />
            )}
            <button
              className="p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-accent ml-1 shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                handleClose(tab);
              }}
            >
              <X className="size-3" />
            </button>
          </div>
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
