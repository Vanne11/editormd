import { useEffect, useRef, useMemo, useCallback } from "react";
import { marked } from "marked";
import TurndownService from "turndown";
import { gfm } from "turndown-plugin-gfm";
import mermaid from "mermaid";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useVaultStore } from "@/stores/vault-store";
import { useUIStore } from "@/stores/ui-store";
import { readImageBase64 } from "@/lib/tauri";
import type { Theme } from "@/types";

const mermaidThemeMap: Record<Theme, string> = {
  dark: "dark",
  light: "default",
  sepia: "neutral",
  pastel: "default",
  dracula: "dark",
  alucard: "dark",
};

function initMermaid(appTheme: Theme) {
  mermaid.initialize({
    startOnLoad: false,
    theme: mermaidThemeMap[appTheme] || "dark",
    securityLevel: "loose",
    flowchart: { htmlLabels: false },
    sequence: { useMaxWidth: false },
  });
}

marked.use({ gfm: true, breaks: true });

interface MarkdownPreviewProps {
  content: string;
  onChange?: (content: string) => void;
}

async function resolveLocalImages(container: HTMLElement, vaultPath: string | null) {
  if (!vaultPath) return;
  const images = container.querySelectorAll("img");
  for (const img of images) {
    const src = img.getAttribute("src");
    if (!src || src.startsWith("http") || src.startsWith("data:")) continue;
    try {
      const dataUri = await readImageBase64(vaultPath, src);
      img.src = dataUri;
    } catch {
      img.style.display = "none";
    }
  }
}

async function renderMermaidBlocks(container: HTMLElement) {
  const blocks = container.querySelectorAll("code.language-mermaid");
  if (blocks.length === 0) return;

  for (const block of blocks) {
    const pre = block.parentElement;
    if (!pre || pre.tagName !== "PRE") continue;
    const code = block.textContent || "";
    // Replace <pre><code> with a <div class="mermaid"> wrapper for mermaid.run()
    const wrapper = document.createElement("div");
    wrapper.className = "my-4 flex justify-center";
    wrapper.setAttribute("data-mermaid", code);
    const mermaidDiv = document.createElement("pre");
    mermaidDiv.className = "mermaid";
    mermaidDiv.textContent = code;
    wrapper.appendChild(mermaidDiv);
    pre.replaceWith(wrapper);
  }

  try {
    const nodes = container.querySelectorAll(".mermaid");
    await mermaid.run({ nodes: nodes as unknown as ArrayLike<HTMLElement> });
  } catch (e) {
    console.error("Mermaid rendering error:", e);
  }
}

export function MarkdownPreview({ content, onChange }: MarkdownPreviewProps) {
  const vaultPath = useVaultStore((s) => s.vaultPath);
  const theme = useUIStore((s) => s.theme);
  const divRef = useRef<HTMLDivElement>(null);
  const focusedRef = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const turndown = useMemo(() => {
    const td = new TurndownService({
      headingStyle: "atx",
      codeBlockStyle: "fenced",
      emDelimiter: "*",
    });
    td.use(gfm);
    td.addRule("mermaid", {
      filter: (node) =>
        node.nodeName === "DIV" && node.getAttribute("data-mermaid") !== null,
      replacement: (_content, node) => {
        const code = (node as HTMLElement).getAttribute("data-mermaid") || "";
        return "\n```mermaid\n" + code + "\n```\n";
      },
    });
    return td;
  }, []);

  // Render markdown → HTML only when NOT focused
  useEffect(() => {
    if (!divRef.current || focusedRef.current) return;
    try {
      initMermaid(theme);
      const raw = marked.parse(content) as string;
      divRef.current.innerHTML = raw;
      resolveLocalImages(divRef.current, vaultPath);
      renderMermaidBlocks(divRef.current);
    } catch (e) {
      console.error("Error rendering preview:", e);
      if (divRef.current) divRef.current.textContent = content;
    }
  }, [content, vaultPath, theme]);

  // Sync preview edits → store (debounced)
  const syncToEditor = useCallback(() => {
    if (!divRef.current || !onChange) return;
    const md = turndown.turndown(divRef.current.innerHTML);
    onChange(md);
  }, [onChange, turndown]);

  const handleInput = useCallback(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(syncToEditor, 400);
  }, [syncToEditor]);

  const handleFocus = useCallback(() => {
    focusedRef.current = true;
  }, []);

  const handleBlur = useCallback(() => {
    clearTimeout(debounceRef.current);
    focusedRef.current = false;
    syncToEditor();
  }, [syncToEditor]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => clearTimeout(debounceRef.current);
  }, []);

  return (
    <ScrollArea className="h-full">
      <div
        ref={divRef}
        contentEditable={!!onChange}
        suppressContentEditableWarning
        className="prose prose-invert max-w-none p-6 preview-content outline-none break-words"
        onInput={handleInput}
        onFocus={handleFocus}
        onBlur={handleBlur}
      />
    </ScrollArea>
  );
}
