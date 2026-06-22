# Futuras Mejoras - EditorMD

## Prioridad Alta

- [x] **Busqueda global** — Buscar notas por nombre y por contenido (Ctrl+Shift+F). Command palette (Ctrl+P) para abrir notas y ejecutar comandos.
- [x] **Auto-guardado** — Debounce de 1.5s tras el ultimo cambio, con toggle en Configuracion. Elimina la friccion de Ctrl+S constante.
- [x] **Find & Replace en editor** — Ctrl+F / Ctrl+H mediante `@codemirror/search`, con panel traducido al idioma activo.
- [x] **Links internos** — Soporte para `[[otra-nota]]` y `[[nota|alias]]` en el preview, con click para abrir o crear la nota.
- [x] **Archivos recientes / favoritos** — Panel en el sidebar con notas recientes y favoritos pineables (persistido por boveda).

## Prioridad Media

- [x] **Math/LaTeX** — `$ecuacion$` y `$$bloque$$` con KaTeX (vía WYSIWYG/Milkdown).
- [ ] **Table of Contents** — Outline de headings en el sidebar para navegacion rapida en notas largas.
- [ ] **Templates** — Plantillas al crear nota nueva (diario, meeting notes, proyecto). Directorio `_templates/` en el vault.
- [x] **Syntax highlighting** — Colores en bloques de codigo del editor WYSIWYG (Prism/refractor).
- [ ] **Drag & drop** — Arrastrar archivos/imagenes al editor para importarlos directamente.
