import type { Ctx } from "@milkdown/ctx";
import { prism, prismConfig } from "@milkdown/plugin-prism";
import markup from "refractor/markup";
import css from "refractor/css";
import clike from "refractor/clike";
import javascript from "refractor/javascript";
import typescript from "refractor/typescript";
import jsx from "refractor/jsx";
import tsx from "refractor/tsx";
import json from "refractor/json";
import bash from "refractor/bash";
import python from "refractor/python";
import rust from "refractor/rust";
import go from "refractor/go";
import yaml from "refractor/yaml";
import markdown from "refractor/markdown";
import sql from "refractor/sql";

// Lenguajes registrados para el resaltado de bloques de código en WYSIWYG.
const languages = [
  markup,
  css,
  clike,
  javascript,
  typescript,
  jsx,
  tsx,
  json,
  bash,
  python,
  rust,
  go,
  yaml,
  markdown,
  sql,
];

/** Configura refractor con un conjunto de lenguajes comunes. */
export function configurePrism(ctx: Ctx) {
  ctx.set(prismConfig.key, {
    configureRefractor: (refractor) => {
      for (const lang of languages) {
        refractor.register(lang);
      }
    },
  });
}

export { prism };
