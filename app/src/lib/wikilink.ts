import type { TokenizerAndRendererExtension } from "marked";
import type { FileEntry } from "@/types";
import { flattenFiles } from "@/lib/file-utils";

const WIKILINK_RE = /^\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/;

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

interface WikilinkToken {
  type: "wikilink";
  raw: string;
  target: string;
  label: string;
}

/**
 * Extensión de marked para renderizar `[[nota]]` y `[[nota|alias]]` como un
 * enlace interno con `data-wikilink`, que MarkdownPreview intercepta al hacer
 * click para navegar a la nota.
 */
export const wikilinkExtension: TokenizerAndRendererExtension = {
  name: "wikilink",
  level: "inline",
  start(src: string) {
    return src.indexOf("[[");
  },
  tokenizer(src: string): WikilinkToken | undefined {
    const match = WIKILINK_RE.exec(src);
    if (!match) return undefined;
    const target = match[1].trim();
    const label = (match[2] || match[1]).trim();
    return { type: "wikilink", raw: match[0], target, label };
  },
  renderer(token) {
    const { target, label } = token as unknown as WikilinkToken;
    return `<a class="wikilink" data-wikilink="${encodeURIComponent(target)}">${escapeHtml(label)}</a>`;
  },
};

/**
 * Resuelve el destino de un wikilink contra el árbol de archivos. Acepta
 * coincidencia por ruta relativa o por nombre, con o sin extensión `.md`.
 * Devuelve la ruta relativa del archivo o `null` si no existe.
 */
export function resolveWikilink(target: string, tree: FileEntry[]): string | null {
  const files = flattenFiles(tree);
  const normalized = target.replace(/\\/g, "/").trim();
  const candidates = normalized.endsWith(".md")
    ? [normalized]
    : [`${normalized}.md`, normalized];

  // Coincidencia exacta por ruta relativa.
  for (const cand of candidates) {
    const byPath = files.find((f) => f.path === cand);
    if (byPath) return byPath.path;
  }

  // Coincidencia por nombre de archivo (sin importar la carpeta).
  const baseName = normalized.split("/").pop() || normalized;
  const nameCandidates = baseName.endsWith(".md") ? [baseName] : [`${baseName}.md`, baseName];
  for (const cand of nameCandidates) {
    const byName = files.find((f) => f.name.toLowerCase() === cand.toLowerCase());
    if (byName) return byName.path;
  }

  return null;
}

/** Construye la ruta relativa que tendría una nota nueva creada desde un wikilink. */
export function wikilinkToNewPath(target: string): string {
  const normalized = target.replace(/\\/g, "/").trim();
  return normalized.endsWith(".md") ? normalized : `${normalized}.md`;
}
