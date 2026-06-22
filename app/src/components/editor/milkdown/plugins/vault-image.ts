import { $prose } from "@milkdown/utils";
import { Plugin, PluginKey } from "@milkdown/prose/state";
import type { NodeView } from "@milkdown/prose/view";
import type { Node as ProseNode } from "@milkdown/prose/model";
import { useVaultStore } from "@/stores/vault-store";
import { isResolvableImageSrc, resolveVaultImage } from "@/lib/resolve-images";

/**
 * NodeView para el nodo `image` que resuelve rutas relativas del vault a data
 * URIs (vía readImageBase64) sin tocar el markdown fuente, que conserva la ruta
 * relativa para un round-trip sin pérdida.
 */
class VaultImageView implements NodeView {
  dom: HTMLImageElement;
  private currentSrc: string;

  constructor(node: ProseNode) {
    this.dom = document.createElement("img");
    this.dom.className = "milkdown-image";
    this.currentSrc = node.attrs.src ?? "";
    this.applyAttrs(node);
    this.resolve(this.currentSrc);
  }

  private applyAttrs(node: ProseNode) {
    this.dom.alt = node.attrs.alt ?? "";
    if (node.attrs.title) this.dom.title = node.attrs.title;
  }

  private resolve(src: string) {
    if (!isResolvableImageSrc(src)) {
      this.dom.src = src;
      return;
    }
    const vaultPath = useVaultStore.getState().vaultPath;
    if (!vaultPath) {
      this.dom.src = src;
      return;
    }
    resolveVaultImage(vaultPath, src).then((dataUri) => {
      if (dataUri) {
        this.dom.src = dataUri;
      } else {
        this.dom.style.opacity = "0.3";
      }
    });
  }

  update(node: ProseNode) {
    if (node.type.name !== "image") return false;
    this.applyAttrs(node);
    const nextSrc = node.attrs.src ?? "";
    if (nextSrc !== this.currentSrc) {
      this.currentSrc = nextSrc;
      this.dom.style.opacity = "";
      this.resolve(nextSrc);
    }
    return true;
  }
}

export const vaultImagePlugin = $prose(
  () =>
    new Plugin({
      key: new PluginKey("vault-image"),
      props: {
        nodeViews: {
          image: (node) => new VaultImageView(node),
        },
      },
    })
);
