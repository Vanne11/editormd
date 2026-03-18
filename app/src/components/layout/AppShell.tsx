import { useRef, useCallback } from "react";
import { Sidebar } from "./Sidebar";
import { StatusBar } from "./StatusBar";
import { EditorArea } from "@/components/editor/EditorArea";
import { SettingsDialog } from "@/components/settings/SettingsDialog";
import { useUIStore } from "@/stores/ui-store";

export function AppShell() {
  const setSidebarWidth = useUIStore((s) => s.setSidebarWidth);
  const sidebarVisible = useUIStore((s) => s.sidebarVisible);
  const settingsOpen = useUIStore((s) => s.settingsOpen);
  const setSettingsOpen = useUIStore((s) => s.setSettingsOpen);
  const isResizing = useRef(false);

  const handleMouseDown = useCallback(() => {
    isResizing.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing.current) return;
      const width = Math.max(180, Math.min(500, e.clientX));
      setSidebarWidth(width);
    };

    const handleMouseUp = () => {
      isResizing.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  }, [setSidebarWidth]);

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      <div className="flex flex-1 min-h-0">
        <Sidebar />
        {sidebarVisible && (
          <div
            className="w-1 cursor-col-resize hover:bg-primary/30 active:bg-primary/50 transition-colors shrink-0"
            onMouseDown={handleMouseDown}
          />
        )}
        <EditorArea />
      </div>
      <StatusBar />
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
}
