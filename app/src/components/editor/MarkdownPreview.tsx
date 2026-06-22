import { useEffect, useRef, useCallback } from "react";
import { marked } from "marked";
import mermaid from "mermaid";
import { useVaultStore } from "@/stores/vault-store";
import { useUIStore } from "@/stores/ui-store";
import { readImageBase64 } from "@/lib/tauri";
import { wikilinkExtension, resolveWikilink } from "@/lib/wikilink";
import { navigateWikilink } from "@/lib/wikilink-navigate";
import { initMermaid } from "@/lib/mermaid-theme";
import type { FileEntry } from "@/types";

marked.use({ gfm: true, breaks: true });
marked.use({ extensions: [wikilinkExtension] });

interface MarkdownPreviewProps {
  content: string;
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

function markMissingWikilinks(container: HTMLElement, tree: FileEntry[]) {
  const links = container.querySelectorAll<HTMLAnchorElement>("a.wikilink");
  for (const link of links) {
    const target = decodeURIComponent(link.getAttribute("data-wikilink") || "");
    const resolved = resolveWikilink(target, tree);
    link.setAttribute("data-missing", resolved ? "false" : "true");
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

/** Vista de solo lectura del markdown renderizado (modo split). */
export function MarkdownPreview({ content }: MarkdownPreviewProps) {
  const vaultPath = useVaultStore((s) => s.vaultPath);
  const fileTree = useVaultStore((s) => s.fileTree);
  const theme = useUIStore((s) => s.theme);
  const divRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!divRef.current) return;
    try {
      initMermaid(theme);
      const raw = marked.parse(content) as string;
      divRef.current.innerHTML = raw;
      resolveLocalImages(divRef.current, vaultPath);
      markMissingWikilinks(divRef.current, fileTree);
      renderMermaidBlocks(divRef.current);
    } catch (e) {
      console.error("Error rendering preview:", e);
      if (divRef.current) divRef.current.textContent = content;
    }
  }, [content, vaultPath, theme, fileTree]);

  // Navigate wikilinks on click (open existing note or create a new one).
  const handleClick = useCallback((e: React.MouseEvent) => {
    const anchor = (e.target as HTMLElement).closest<HTMLAnchorElement>("a.wikilink");
    if (!anchor) return;
    e.preventDefault();
    const target = decodeURIComponent(anchor.getAttribute("data-wikilink") || "");
    navigateWikilink(target);
  }, []);

  return (
    <div className="preview-scroll h-full overflow-auto">
      <div
        ref={divRef}
        className="prose prose-invert max-w-none p-6 preview-content break-words"
        onClick={handleClick}
      />
    </div>
  );
}
