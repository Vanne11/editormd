import { EditorView, Decoration, WidgetType } from "@codemirror/view";
import type { DecorationSet } from "@codemirror/view";
import { StateField, RangeSetBuilder } from "@codemirror/state";
import type { Transaction } from "@codemirror/state";
import { useVaultStore } from "@/stores/vault-store";
import { readImageBase64 } from "@/lib/tauri";

class ImageWidget extends WidgetType {
  constructor(
    readonly src: string,
    readonly alt: string,
    readonly isLocal: boolean,
    readonly vaultPath: string | null
  ) {
    super();
  }

  toDOM() {
    const wrapper = document.createElement("div");
    wrapper.style.padding = "4px 0";

    const img = document.createElement("img");
    img.alt = this.alt;
    img.style.maxWidth = "100%";
    img.style.maxHeight = "200px";
    img.style.borderRadius = "4px";
    img.style.display = "block";
    img.onerror = () => {
      wrapper.style.display = "none";
    };

    if (this.isLocal && this.vaultPath) {
      readImageBase64(this.vaultPath, this.src)
        .then((dataUri) => {
          img.src = dataUri;
        })
        .catch(() => {
          wrapper.style.display = "none";
        });
    } else {
      img.src = this.src;
    }

    wrapper.appendChild(img);
    return wrapper;
  }

  eq(other: ImageWidget) {
    return this.src === other.src && this.alt === other.alt;
  }
}

function isLocalPath(src: string): boolean {
  return !src.startsWith("http://") && !src.startsWith("https://") && !src.startsWith("data:");
}

function buildDecorations(doc: { lines: number; line: (n: number) => { text: string; to: number } }): DecorationSet {
  try {
    const vaultPath = useVaultStore.getState().vaultPath;
    const builder = new RangeSetBuilder<Decoration>();
    const regex = /!\[([^\]]*)\]\(([^)]+)\)/g;

    for (let i = 1; i <= doc.lines; i++) {
      const line = doc.line(i);
      let match;
      regex.lastIndex = 0;
      while ((match = regex.exec(line.text)) !== null) {
        const alt = match[1];
        const src = match[2];
        const local = isLocalPath(src);
        builder.add(
          line.to,
          line.to,
          Decoration.widget({
            widget: new ImageWidget(src, alt, local, vaultPath),
            block: true,
          })
        );
      }
    }

    return builder.finish();
  } catch {
    return Decoration.none;
  }
}

export const imagePreviewField = StateField.define<DecorationSet>({
  create(state) {
    return buildDecorations(state.doc);
  },
  update(decorations: DecorationSet, tr: Transaction) {
    if (tr.docChanged) {
      return buildDecorations(tr.newDoc);
    }
    return decorations;
  },
  provide: (f) => EditorView.decorations.from(f),
});
