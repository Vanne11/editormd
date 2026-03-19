import TurndownService from "turndown";
import { gfm } from "turndown-plugin-gfm";

export function htmlToMarkdown(html: string): string {
  const turndown = new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
    bulletListMarker: "-",
  });
  turndown.use(gfm);
  return turndown.turndown(html);
}
