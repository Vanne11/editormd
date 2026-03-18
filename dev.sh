#!/usr/bin/env bash
set -euo pipefail

APP_DIR="$(cd "$(dirname "$0")/app" && pwd)"

# Colores
R='\033[0;31m' G='\033[0;32m' Y='\033[1;33m' C='\033[0;36m' NC='\033[0m'

show_menu() {
  echo ""
  echo -e "${C}═══════════════════════════════════════${NC}"
  echo -e "${C}   EditorMD - Herramientas de desarrollo${NC}"
  echo -e "${C}═══════════════════════════════════════${NC}"
  echo ""
  echo -e "  ${G}1)${NC} Instalar dependencias"
  echo -e "  ${G}2)${NC} Iniciar en modo desarrollo"
  echo -e "  ${G}3)${NC} Compilar para producción"
  echo -e "  ${G}4)${NC} Verificar tipos (TypeScript)"
  echo -e "  ${G}5)${NC} Verificar Rust (cargo check)"
  echo -e "  ${G}6)${NC} Limpiar builds"
  echo -e "  ${G}7)${NC} Lint frontend"
  echo -e "  ${G}0)${NC} Salir"
  echo ""
}

cmd_install() {
  echo -e "${Y}Instalando dependencias npm...${NC}"
  cd "$APP_DIR" && npm install
  echo -e "${G}Listo.${NC}"
}

cmd_dev() {
  echo -e "${Y}Iniciando modo desarrollo...${NC}"
  cd "$APP_DIR" && npm run tauri dev
}

cmd_build() {
  echo -e "${Y}Compilando para producción...${NC}"
  cd "$APP_DIR" && npm run tauri build
  echo -e "${G}Build completo. Revisa app/src-tauri/target/release/${NC}"
}

cmd_tsc() {
  echo -e "${Y}Verificando tipos TypeScript...${NC}"
  cd "$APP_DIR" && npx tsc -b
  echo -e "${G}Sin errores de tipos.${NC}"
}

cmd_cargo_check() {
  echo -e "${Y}Verificando Rust...${NC}"
  cd "$APP_DIR/src-tauri" && cargo check
  echo -e "${G}Sin errores de Rust.${NC}"
}

cmd_clean() {
  echo -e "${Y}Limpiando builds...${NC}"
  rm -rf "$APP_DIR/dist"
  rm -rf "$APP_DIR/src-tauri/target"
  rm -rf "$APP_DIR/node_modules/.tmp"
  echo -e "${G}Limpio.${NC}"
}

cmd_lint() {
  echo -e "${Y}Ejecutando lint...${NC}"
  cd "$APP_DIR" && npm run lint
  echo -e "${G}Lint completo.${NC}"
}

# Si se pasa un argumento directo, ejecutar sin menú
if [[ $# -gt 0 ]]; then
  case "$1" in
    install)  cmd_install ;;
    dev)      cmd_dev ;;
    build)    cmd_build ;;
    tsc)      cmd_tsc ;;
    check)    cmd_cargo_check ;;
    clean)    cmd_clean ;;
    lint)     cmd_lint ;;
    *)        echo -e "${R}Comando desconocido: $1${NC}"; echo "Uso: $0 {install|dev|build|tsc|check|clean|lint}"; exit 1 ;;
  esac
  exit 0
fi

# Menú interactivo
while true; do
  show_menu
  read -rp "  Opción: " opt
  case "$opt" in
    1) cmd_install ;;
    2) cmd_dev ;;
    3) cmd_build ;;
    4) cmd_tsc ;;
    5) cmd_cargo_check ;;
    6) cmd_clean ;;
    7) cmd_lint ;;
    0) echo -e "${G}Hasta luego.${NC}"; exit 0 ;;
    *) echo -e "${R}Opción inválida${NC}" ;;
  esac
done
