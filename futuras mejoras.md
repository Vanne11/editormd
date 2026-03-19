# Futuras Mejoras - EditorMD

## Prioridad Alta

- [ ] **Busqueda global** — Buscar notas por nombre y por contenido (Ctrl+Shift+F). Implementar command palette (Ctrl+P ya mapeado pero sin componente).
- [ ] **Auto-guardado** — Debounce de 1-2 segundos tras el ultimo cambio. Eliminar la friccion de Ctrl+S constante.
- [ ] **Find & Replace en editor** — Ctrl+F / Ctrl+H. Habilitar la extension `@codemirror/search` que ya existe en CodeMirror 6.
- [ ] **Links internos** — Soporte para `[[otra-nota]]`. Convierte archivos sueltos en un sistema de conocimiento conectado.
- [ ] **Archivos recientes / favoritos** — Panel de notas recientes y/o pineadas para acceso rapido al abrir el editor.

## Prioridad Media

- [ ] **Math/LaTeX** — Soporte para `$ecuacion$` y `$$bloque$$` con KaTeX en el preview.
- [ ] **Table of Contents** — Outline de headings en el sidebar para navegacion rapida en notas largas.
- [ ] **Templates** — Plantillas al crear nota nueva (diario, meeting notes, proyecto). Directorio `_templates/` en el vault.
- [ ] **Syntax highlighting en preview** — Colores en bloques de codigo del preview con `highlight.js` o `shiki`.
- [ ] **Drag & drop** — Arrastrar archivos/imagenes al editor para importarlos directamente.
