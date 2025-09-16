# Diccionario de temas

themes = {
    "Oscuro": {
        "background": "#1e1e1e",
        "editor_bg": "#252526",
        "editor_fg": "#d4d4d4",
        "preview_bg": "#1e1e1e",
        "preview_fg": "#d4d4d4",
        "menu_bg": "#2d2d30",
        "menu_fg": "#d4d4d4",
        "menu_selected": "#007acc",
    },
    "Pastel Morado": {
        "background": "#f6f0fa",
        "editor_bg": "#ede7f6",
        "editor_fg": "#4a148c",
        "preview_bg": "#f3e5f5",
        "preview_fg": "#311b92",
        "menu_bg": "#d1c4e9",
        "menu_fg": "#4a148c",
        "menu_selected": "#b39ddb",
    },
    "Claro": {
        "background": "#ffffff",
        "editor_bg": "#fafafa",
        "editor_fg": "#000000",
        "preview_bg": "#ffffff",
        "preview_fg": "#000000",
        "menu_bg": "#eeeeee",
        "menu_fg": "#000000",
        "menu_selected": "#cccccc",
    }
}


def generate_stylesheet(palette):
    return f"""
    QMainWindow {{
        background-color: {palette['background']};
        color: {palette['editor_fg']};
    }}

    QTextEdit {{
        background-color: {palette['editor_bg']};
        color: {palette['editor_fg']};
        font-family: Consolas, "Courier New", monospace;
        font-size: 14px;
    }}

    QTextBrowser {{
        background-color: {palette['preview_bg']};
        color: {palette['preview_fg']};
        font-family: Segoe UI, sans-serif;
        font-size: 14px;
    }}

    QMenuBar, QMenu {{
        background-color: {palette['menu_bg']};
        color: {palette['menu_fg']};
    }}

    QMenu::item:selected {{
        background-color: {palette['menu_selected']};
    }}
    """
