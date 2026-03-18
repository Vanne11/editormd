import { useEffect } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppShell } from "@/components/layout/AppShell";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useVaultStore } from "@/stores/vault-store";
import { useUIStore } from "@/stores/ui-store";

function App() {
  useKeyboardShortcuts();

  const setVaultPath = useVaultStore((s) => s.setVaultPath);
  const theme = useUIStore((s) => s.theme);

  // Restore last vault on startup
  useEffect(() => {
    const lastVault = localStorage.getItem("editormd_last_vault");
    if (lastVault) {
      setVaultPath(lastVault);
    }
  }, [setVaultPath]);

  // Apply theme class to html
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  return (
    <TooltipProvider delayDuration={300}>
      <AppShell />
    </TooltipProvider>
  );
}

export default App;
