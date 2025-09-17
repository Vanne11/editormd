import sys
import re
import markdown
from PySide6.QtWidgets import (
    QApplication, QMainWindow, QFileDialog, QTextEdit, QSplitter,
    QComboBox, QLabel, QDockWidget, QToolBar, QTabWidget, QMessageBox
)
from PySide6.QtGui import QAction
from PySide6.QtCore import Qt
from editor import Editor
from toolbar import EditorToolBar
from exporter import Exporter
from themes import themes, generate_stylesheet


class MainWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("Editor Markdown con Temas")
        self.resize(1200, 800)

        self.tab_data = {}  # Información de cada pestaña: editor, preview, path, modified

        # Contenedor de pestañas
        self.tabs = QTabWidget()
        self.tabs.setTabsClosable(True)
        self.tabs.tabCloseRequested.connect(self.close_tab)
        self.setCentralWidget(self.tabs)

        # Primera pestaña vacía
        self.add_new_tab("", "Nuevo")

        # Toolbar
        self.toolbar = EditorToolBar(self.get_current_editor(), self)
        self.addToolBar(Qt.TopToolBarArea, self.toolbar)

        # Selector de tema
        theme_toolbar = QToolBar("Temas")
        theme_toolbar.addWidget(QLabel("Tema:"))
        self.theme_combo = QComboBox()
        self.theme_combo.addItems(list(themes.keys()))
        self.theme_combo.setCurrentText("Pastel Morado")
        self.theme_combo.currentTextChanged.connect(self.change_theme)
        theme_toolbar.addWidget(self.theme_combo)
        self.addToolBar(Qt.TopToolBarArea, theme_toolbar)

        # Panel de ayuda
        self.create_help_panel()

        # Menú
        self.create_menus()

        # Aplicar tema inicial
        self.change_theme("Pastel Morado")

        # Variables para evitar bucles infinitos
        self.updating_preview = False
        self.updating_markdown = False

    # -----------------------------
    # Pestañas
    # -----------------------------
    def add_new_tab(self, content="", title="Nuevo"):
        splitter = QSplitter(Qt.Horizontal)

        editor = Editor()
        preview = QTextEdit()
        editor.setPlaceholderText("Escribe tu Markdown aquí...")
        preview.setPlaceholderText("Vista previa editable...")
        preview.setAcceptRichText(True)

        editor.setPlainText(content)
        preview.setPlainText(content)

        # Conexiones de sincronización
        editor.textChanged.connect(lambda e=editor: self.mark_modified(self.tabs.currentIndex()))
        editor.textChanged.connect(lambda e=editor, p=preview: self.update_preview_from_markdown(e, p))
        preview.textChanged.connect(lambda p=preview, e=editor: self.update_markdown_from_preview(e, p))

        splitter.addWidget(editor)
        splitter.addWidget(preview)
        splitter.setSizes([600, 600])

        index = self.tabs.addTab(splitter, title)
        self.tabs.setCurrentIndex(index)

        self.tab_data[index] = {
            "editor": editor,
            "preview": preview,
            "path": None if title=="Nuevo" else title,
            "modified": False
        }

    def close_tab(self, index):
        data = self.tab_data.get(index)
        if data and data["modified"]:
            ret = QMessageBox.question(self, "Guardar cambios?",
                f"¿Deseas guardar los cambios en {self.tabs.tabText(index).rstrip('*')}?",
                QMessageBox.Yes | QMessageBox.No | QMessageBox.Cancel)
            if ret == QMessageBox.Yes:
                self.tabs.setCurrentIndex(index)
                self.save_file()
            elif ret == QMessageBox.Cancel:
                return  # No cerrar
        self.tabs.removeTab(index)
        self.tab_data.pop(index, None)

    def get_current_splitter(self):
        return self.tabs.currentWidget()

    def get_current_editor(self):
        splitter = self.get_current_splitter()
        return splitter.widget(0) if splitter else None

    def get_current_preview(self):
        splitter = self.get_current_splitter()
        return splitter.widget(1) if splitter else None

    def mark_modified(self, index):
        if index in self.tab_data:
            self.tab_data[index]["modified"] = True
            title = self.tabs.tabText(index)
            if not title.endswith("*"):
                self.tabs.setTabText(index, title + "*")

    # -----------------------------
    # Menús
    # -----------------------------
    def create_menus(self):
        menubar = self.menuBar()

        # Menú Archivo
        file_menu = menubar.addMenu("Archivo")

        new_action = QAction("Nuevo", self)
        new_action.setShortcut("Ctrl+N")
        new_action.triggered.connect(self.new_file)
        file_menu.addAction(new_action)

        open_action = QAction("Abrir...", self)
        open_action.setShortcut("Ctrl+O")
        open_action.triggered.connect(self.open_file)
        file_menu.addAction(open_action)

        save_action = QAction("Guardar", self)
        save_action.setShortcut("Ctrl+S")
        save_action.triggered.connect(self.save_file)
        file_menu.addAction(save_action)

        export_action = QAction("Exportar", self)
        export_action.triggered.connect(self.export_file)
        file_menu.addAction(export_action)

        # Menú Ver
        view_menu = menubar.addMenu("Ver")

        toggle_editor_action = QAction("Mostrar/Ocultar Editor", self)
        toggle_editor_action.setShortcut("F11")
        toggle_editor_action.triggered.connect(self.toggle_editor)
        view_menu.addAction(toggle_editor_action)

        toggle_preview_action = QAction("Mostrar/Ocultar Vista Previa", self)
        toggle_preview_action.setShortcut("F12")
        toggle_preview_action.triggered.connect(self.toggle_preview)
        view_menu.addAction(toggle_preview_action)

        editor_only_action = QAction("Solo Editor", self)
        editor_only_action.setShortcut("Ctrl+1")
        editor_only_action.triggered.connect(self.show_editor_only)
        view_menu.addAction(editor_only_action)

        preview_only_action = QAction("Solo Vista Previa", self)
        preview_only_action.setShortcut("Ctrl+2")
        preview_only_action.triggered.connect(self.show_preview_only)
        view_menu.addAction(preview_only_action)

        both_action = QAction("Ambos Paneles", self)
        both_action.setShortcut("Ctrl+3")
        both_action.triggered.connect(self.show_both)
        view_menu.addAction(both_action)

        toggle_help_action = QAction("Mostrar/Ocultar Guía", self)
        toggle_help_action.setShortcut("F1")
        toggle_help_action.triggered.connect(self.toggle_help)
        view_menu.addAction(toggle_help_action)

    # -----------------------------
    # Panel de ayuda
    # -----------------------------
    def create_help_panel(self):
        self.help_dock = QDockWidget("Guía de Markdown", self)
        self.help_dock.setAllowedAreas(Qt.LeftDockWidgetArea | Qt.RightDockWidgetArea)

        help_content = QTextEdit()
        help_content.setReadOnly(True)
        help_content.setHtml("""
        <style>
            body { font-family: 'Segoe UI', sans-serif; font-size: 12px; }
            h3 { color: #4a148c; margin: 15px 0 8px 0; }
            h4 { color: #7b1fa2; margin: 12px 0 6px 0; }
            code { background: #f3e5f5; padding: 2px 4px; border-radius: 3px; }
            .example { background: #faf5fc; padding: 8px; margin: 5px 0; border-radius: 4px; }
        </style>

        <h3>📝 Formato de Texto</h3>
        <div class="example">
            <strong>Negrita:</strong> <code>**texto**</code><br>
            <em>Cursiva:</em> <code>*texto*</code><br>
            <code>Código:</code> <code>`código`</code><br>
            <del>Tachado:</del> <code>~~texto~~</code>
        </div>

        <h3>📋 Encabezados</h3>
        <div class="example">
            <code># Título 1</code><br>
            <code>## Título 2</code><br>
            <code>### Título 3</code><br>
            <code>#### Título 4</code>
        </div>

        <h3>📌 Listas</h3>
        <h4>Con viñetas:</h4>
        <div class="example">
            <code>- Elemento 1</code><br>
            <code>- Elemento 2</code><br>
            <code>  - Subelemento</code>
        </div>

        <h4>Numeradas:</h4>
        <div class="example">
            <code>1. Primero</code><br>
            <code>2. Segundo</code><br>
            <code>3. Tercero</code>
        </div>

        <h4>Tareas:</h4>
        <div class="example">
            <code>- [ ] Pendiente</code><br>
            <code>- [x] Completado</code>
        </div>

        <h3>🔗 Enlaces e Imágenes</h3>
        <div class="example">
            <strong>Enlace:</strong><br>
            <code>[Texto](https://ejemplo.com)</code><br><br>
            <strong>Imagen:</strong><br>
            <code>![Alt text](url-imagen.jpg)</code>
        </div>

        <h3>💬 Citas y Código</h3>
        <div class="example">
            <strong>Cita:</strong><br>
            <code>&gt; Texto citado</code><br><br>
            <strong>Bloque de código:</strong><br>
            <code>```javascript<br>console.log("Hola!");<br>```</code>
        </div>

        <h3>📊 Tablas</h3>
        <div class="example">
            <code>| Col 1 | Col 2 |</code><br>
            <code>|-------|-------|</code><br>
            <code>| Dato1 | Dato2 |</code>
        </div>

        <h3>⚡ Atajos de Teclado</h3>
        <div class="example">
            <code>Ctrl+N</code> - Nuevo<br>
            <code>Ctrl+O</code> - Abrir<br>
            <code>Ctrl+S</code> - Guardar<br>
            <code>F11</code> - Ocultar editor<br>
            <code>F12</code> - Ocultar vista previa<br>
            <code>F1</code> - Esta guía
        </div>

        <p style="margin-top: 15px; font-style: italic; color: #666;">
            💡 <strong>Tip:</strong> Puedes editar tanto en el panel izquierdo (Markdown) como en el derecho (visualmente). Los cambios se sincronizan automáticamente.
        </p>
        """)

        self.help_dock.setWidget(help_content)
        self.addDockWidget(Qt.RightDockWidgetArea, self.help_dock)

    # -----------------------------
    # Temas
    # -----------------------------
    def change_theme(self, theme_name):
        if theme_name in themes:
            stylesheet = generate_stylesheet(themes[theme_name])
            self.setStyleSheet(stylesheet)

    # -----------------------------
    # Sincronización Markdown ↔ Preview
    # -----------------------------
    def update_preview_from_markdown(self, editor=None, preview=None):
        if not editor or not preview:
            editor = self.get_current_editor()
            preview = self.get_current_preview()
        if self.updating_markdown:
            return
        self.updating_preview = True
        try:
            markdown_text = editor.toPlainText()
            html = markdown.markdown(markdown_text, extensions=['extra', 'codehilite', 'tables'])
            styled_html = f"""
            <style>
                body {{
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    margin: 0;
                    padding: 10px;
                }}
                h1, h2, h3, h4, h5, h6 {{
                    color: #4a148c;
                    margin-top: 20px;
                    margin-bottom: 10px;
                }}
                code {{
                    background: #f3e5f5;
                    padding: 2px 4px;
                    border-radius: 3px;
                    font-family: 'Consolas', 'Monaco', monospace;
                }}
                pre {{
                    background: #f8f9fa;
                    padding: 12px;
                    border-radius: 6px;
                    overflow-x: auto;
                }}
                blockquote {{
                    border-left: 4px solid #b39ddb;
                    margin: 0;
                    padding-left: 15px;
                    color: #666;
                    font-style: italic;
                }}
                table {{
                    border-collapse: collapse;
                    width: 100%;
                    margin: 10px 0;
                }}
                th, td {{
                    border: 1px solid #ddd;
                    padding: 8px;
                    text-align: left;
                }}
                th {{
                    background-color: #f3e5f5;
                    font-weight: bold;
                }}
                ul, ol {{ padding-left: 20px; }}
                li {{ margin: 5px 0; }}
            </style>
            {html}
            """
            preview.setHtml(styled_html)
        finally:
            self.updating_preview = False

    def update_markdown_from_preview(self, editor=None, preview=None):
        if not editor or not preview:
            editor = self.get_current_editor()
            preview = self.get_current_preview()
        if self.updating_preview:
            return
        self.updating_markdown = True
        try:
            html_content = preview.toHtml()
            body_match = re.search(r'<body[^>]*>(.*?)</body>', html_content, re.DOTALL)
            content = body_match.group(1) if body_match else html_content
            # Conversiones básicas
            content = re.sub(r'<h1[^>]*>(.*?)</h1>', r'# \1', content)
            content = re.sub(r'<h2[^>]*>(.*?)</h2>', r'## \1', content)
            content = re.sub(r'<h3[^>]*>(.*?)</h3>', r'### \1', content)
            content = re.sub(r'<h4[^>]*>(.*?)</h4>', r'#### \1', content)
            content = re.sub(r'<strong[^>]*>(.*?)</strong>', r'**\1**', content)
            content = re.sub(r'<b[^>]*>(.*?)</b>', r'**\1**', content)
            content = re.sub(r'<em[^>]*>(.*?)</em>', r'*\1*', content)
            content = re.sub(r'<i[^>]*>(.*?)</i>', r'*\1*', content)
            content = re.sub(r'<code[^>]*>(.*?)</code>', r'`\1`', content)
            content = re.sub(r'<p[^>]*>(.*?)</p>', r'\1\n\n', content)
            content = re.sub(r'<br[^>]*/?>', r'\n', content)
            content = re.sub(r'<[^>]+>', '', content)
            content = re.sub(r'\n\s*\n\s*\n', r'\n\n', content)
            if content.strip() != editor.toPlainText().strip():
                editor.setPlainText(content.strip())
        finally:
            self.updating_markdown = False

    # -----------------------------
    # Funciones de archivo
    # -----------------------------
    def new_file(self):
        self.add_new_tab("", "Nuevo")

    def open_file(self):
        paths, _ = QFileDialog.getOpenFileNames(self, "Abrir", "", "Markdown (*.md);;Texto (*.txt);;Todos (*.*)")
        for path in paths:
            try:
                with open(path, "r", encoding="utf-8") as f:
                    content = f.read()
                self.add_new_tab(content, path.split("/")[-1])
                index = self.tabs.currentIndex()
                self.tab_data[index]["path"] = path
            except Exception as e:
                print(f"Error al abrir archivo: {e}")

    def save_file(self):
        editor = self.get_current_editor()
        index = self.tabs.currentIndex()
        if editor:
            path = self.tab_data[index].get("path")
            if not path:
                path, _ = QFileDialog.getSaveFileName(self, "Guardar", "", "Markdown (*.md);;Texto (*.txt)")
                if not path:
                    return
                self.tab_data[index]["path"] = path
            try:
                with open(path, "w", encoding="utf-8") as f:
                    f.write(editor.toPlainText())
                self.tab_data[index]["modified"] = False
                self.tabs.setTabText(index, path.split("/")[-1])
            except Exception as e:
                print(f"Error al guardar archivo: {e}")

    def export_file(self):
        editor = self.get_current_editor()
        if editor:
            try:
                Exporter.export_dialog(self, editor.toPlainText())
            except Exception as e:
                print(f"Error al exportar: {e}")

    # -----------------------------
    # Paneles
    # -----------------------------
    def toggle_editor(self):
        editor = self.get_current_editor()
        if editor:
            editor.setVisible(not editor.isVisible())

    def toggle_preview(self):
        preview = self.get_current_preview()
        if preview:
            preview.setVisible(not preview.isVisible())

    def show_editor_only(self):
        editor = self.get_current_editor()
        preview = self.get_current_preview()
        if editor and preview:
            editor.setVisible(True)
            preview.setVisible(False)

    def show_preview_only(self):
        editor = self.get_current_editor()
        preview = self.get_current_preview()
        if editor and preview:
            editor.setVisible(False)
            preview.setVisible(True)

    def show_both(self):
        editor = self.get_current_editor()
        preview = self.get_current_preview()
        if editor and preview:
            editor.setVisible(True)
            preview.setVisible(True)

    def toggle_help(self):
        self.help_dock.setVisible(not self.help_dock.isVisible())

    # -----------------------------
    # Evento cerrar
    # -----------------------------
    def closeEvent(self, event):
        for index in range(self.tabs.count()):
            data = self.tab_data.get(index)
            if data and data["modified"]:
                self.tabs.setCurrentIndex(index)
                ret = QMessageBox.question(self, "Guardar cambios?",
                    f"¿Deseas guardar los cambios en {self.tabs.tabText(index).rstrip('*')}?",
                    QMessageBox.Yes | QMessageBox.No | QMessageBox.Cancel)
                if ret == QMessageBox.Yes:
                    self.save_file()
                elif ret == QMessageBox.Cancel:
                    event.ignore()
                    return
        event.accept()


if __name__ == "__main__":
    app = QApplication(sys.argv)
    window = MainWindow()
    window.show()
    sys.exit(app.exec())
