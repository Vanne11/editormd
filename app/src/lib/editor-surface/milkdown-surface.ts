import type { Editor } from "@milkdown/core";
import { editorViewCtx } from "@milkdown/core";
import type { Ctx } from "@milkdown/ctx";
import { callCommand, insert } from "@milkdown/utils";
import {
  toggleStrongCommand,
  toggleEmphasisCommand,
  toggleInlineCodeCommand,
  wrapInHeadingCommand,
  wrapInBulletListCommand,
  wrapInOrderedListCommand,
  wrapInBlockquoteCommand,
  insertHrCommand,
  toggleLinkCommand,
  insertImageCommand,
} from "@milkdown/preset-commonmark";
import { toggleStrikethroughCommand, insertTableCommand } from "@milkdown/preset-gfm";
import type { EditorSurface, ToolbarKey } from "./types";

/** Superficie de edición respaldada por Milkdown (modo WYSIWYG). */
export function createMilkdownSurface(editor: Editor): EditorSurface {
  const run = (action: (ctx: Ctx) => void) => {
    editor.action(action);
  };

  return {
    runAction: (key: ToolbarKey) => {
      switch (key) {
        case "bold":
          run(callCommand(toggleStrongCommand.key));
          break;
        case "italic":
          run(callCommand(toggleEmphasisCommand.key));
          break;
        case "strikethrough":
          run(callCommand(toggleStrikethroughCommand.key));
          break;
        case "heading1":
          run(callCommand(wrapInHeadingCommand.key, 1));
          break;
        case "heading2":
          run(callCommand(wrapInHeadingCommand.key, 2));
          break;
        case "heading3":
          run(callCommand(wrapInHeadingCommand.key, 3));
          break;
        case "list":
          run(callCommand(wrapInBulletListCommand.key));
          break;
        case "orderedList":
          run(callCommand(wrapInOrderedListCommand.key));
          break;
        case "checklist":
          // No hay comando directo de task-list: insertamos el markdown.
          run(insert("- [ ] "));
          break;
        case "code":
          run(callCommand(toggleInlineCodeCommand.key));
          break;
        case "quote":
          run(callCommand(wrapInBlockquoteCommand.key));
          break;
        case "link":
          run(callCommand(toggleLinkCommand.key, { href: "" }));
          break;
        case "table":
          run(callCommand(insertTableCommand.key));
          break;
        case "separator":
          run(callCommand(insertHrCommand.key));
          break;
      }
    },
    insertImage: (relativePath: string) => {
      run(callCommand(insertImageCommand.key, { src: relativePath }));
    },
    focus: () => {
      editor.action((ctx) => {
        ctx.get(editorViewCtx).focus();
      });
    },
  };
}
