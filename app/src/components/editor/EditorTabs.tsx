import { X, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEditorStore } from "@/stores/editor-store";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

export function EditorTabs() {
  const tabs = useEditorStore((s) => s.tabs);
  const activeTabId = useEditorStore((s) => s.activeTabId);
  const setActiveTab = useEditorStore((s) => s.setActiveTab);
  const closeTab = useEditorStore((s) => s.closeTab);

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
                closeTab(tab.id);
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
