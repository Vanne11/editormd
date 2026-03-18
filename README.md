# EditorMD

Gestor de notas personal tipo Obsidian/OneNote construido con Tauri 2, React 19 y TypeScript. Pensado para editar, previsualizar y organizar archivos Markdown desde el escritorio.

*[English version below](#editormd-en)*

---

## Stack

| Capa | Tecnología |
|------|-----------|
| Backend | Tauri 2, Rust |
| Frontend | React 19, TypeScript, Vite |
| Estilos | Tailwind CSS v4, Shadcn UI, Radix UI |
| Editor | CodeMirror 6 |
| Preview | react-markdown + remark-gfm + rehype-highlight |
| Estado | Zustand |
| Iconos | lucide-react |

## Características

- Editor Markdown con syntax highlighting (CodeMirror 6)
- Preview en tiempo real con soporte GFM (tablas, checklists, etc.)
- Vista dividida: solo editor, solo preview, o split
- Árbol de archivos con crear, renombrar y eliminar notas/carpetas
- Tabs multi-archivo con indicador de cambios sin guardar
- Barra de herramientas Markdown (negrita, cursiva, encabezados, listas, código, tablas, etc.)
- 5 temas: Oscuro, Claro, Pastel Morado, Sepia, Alucard
- Internacionalización: Español e Inglés
- Barra de estado: posición del cursor, conteo de palabras/caracteres
- Sistema de bóvedas (vaults): abre cualquier carpeta como bóveda de notas
- Atajos de teclado: Ctrl+S, Ctrl+N, Ctrl+O, Ctrl+B, Ctrl+1/2/3, Ctrl+P

## Requisitos

- [Rust](https://rustup.rs/) >= 1.77
- [Node.js](https://nodejs.org/) >= 18
- Dependencias de sistema para Tauri 2 en Linux:
  ```bash
  sudo pacman -S webkit2gtk-4.1 base-devel curl wget file openssl appmenu-gtk-module gtk3 libappindicator-gtk3 librsvg
  ```

## Instalación

```bash
git clone https://github.com/tu-usuario/editormd.git
cd editormd
./dev.sh install
```

## Uso

```bash
# Menú interactivo de herramientas
./dev.sh

# Comandos directos
./dev.sh dev        # Modo desarrollo con hot reload
./dev.sh build      # Compilar para producción
./dev.sh tsc        # Verificar tipos TypeScript
./dev.sh check      # Verificar Rust (cargo check)
./dev.sh lint       # Lint del frontend
./dev.sh clean      # Limpiar builds
```

## Estructura del proyecto

```
editormd/
├── app/
│   ├── src/                    # Frontend React + TypeScript
│   │   ├── components/         # Componentes UI modulares
│   │   │   ├── ui/             # Primitivos Shadcn/Radix
│   │   │   ├── layout/         # AppShell, Sidebar, StatusBar
│   │   │   ├── file-tree/      # Explorador de archivos
│   │   │   └── editor/         # CodeMirror, Preview, Toolbar, Tabs
│   │   ├── stores/             # Zustand (vault, editor, ui, settings)
│   │   ├── hooks/              # Hooks personalizados
│   │   ├── lib/                # Wrappers Tauri, i18n, utilidades
│   │   └── types/              # Definiciones TypeScript
│   ├── src-tauri/              # Backend Rust
│   │   └── src/
│   │       ├── commands/       # Comandos Tauri (vault, files)
│   │       └── models/         # Estructuras de datos
│   ├── package.json
│   └── vite.config.ts
├── dev.sh                      # Script de herramientas de desarrollo
└── .gitignore
```

## Atajos de teclado

| Atajo | Acción |
|-------|--------|
| `Ctrl+S` | Guardar nota activa |
| `Ctrl+N` | Nueva nota |
| `Ctrl+O` | Abrir bóveda |
| `Ctrl+B` | Mostrar/ocultar sidebar |
| `Ctrl+1` | Solo editor |
| `Ctrl+2` | Vista dividida |
| `Ctrl+3` | Solo preview |
| `Ctrl+P` | Command palette |

## Licencia

MIT

---

# EditorMD (EN)

Personal note manager similar to Obsidian/OneNote built with Tauri 2, React 19, and TypeScript. Designed to edit, preview, and organize Markdown files from the desktop.

## Features

- Markdown editor with syntax highlighting (CodeMirror 6)
- Real-time preview with GFM support (tables, checklists, etc.)
- Split view: editor only, preview only, or split
- File tree with create, rename, and delete notes/folders
- Multi-file tabs with unsaved changes indicator
- Markdown toolbar (bold, italic, headings, lists, code, tables, etc.)
- 5 themes: Dark, Light, Purple Pastel, Sepia, Alucard
- Internationalization: Spanish and English
- Status bar: cursor position, word/character count
- Vault system: open any folder as a note vault
- Keyboard shortcuts: Ctrl+S, Ctrl+N, Ctrl+O, Ctrl+B, Ctrl+1/2/3, Ctrl+P

## Requirements

- [Rust](https://rustup.rs/) >= 1.77
- [Node.js](https://nodejs.org/) >= 18
- Tauri 2 system dependencies for Linux:
  ```bash
  sudo pacman -S webkit2gtk-4.1 base-devel curl wget file openssl appmenu-gtk-module gtk3 libappindicator-gtk3 librsvg
  ```

## Setup

```bash
git clone https://github.com/your-user/editormd.git
cd editormd
./dev.sh install
```

## Usage

```bash
# Interactive tools menu
./dev.sh

# Direct commands
./dev.sh dev        # Development mode with hot reload
./dev.sh build      # Production build
./dev.sh tsc        # TypeScript type check
./dev.sh check      # Rust check (cargo check)
./dev.sh lint       # Frontend lint
./dev.sh clean      # Clean builds
```

## License

MIT
