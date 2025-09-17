import sys
from PySide6.QtWidgets import QApplication, QMainWindow, QFileDialog, QTextEdit, QSplitter, QComboBox, QLabel
from PySide6.QtWidgets import QToolBar
from PySide6.QtGui import QAction
from PySide6.QtCore import Qt
from editor import Editor
from toolbar import EditorToolBar
from exporter import Exporter
from themes import themes, generate_stylesheet
import markdown


class MainWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("Editor Markdown con Temas")
        self.resize(1200, 800)

        # Editor y vista previa
        splitter = QSplitter(Qt.Horizontal)
        
        self.editor = Editor()
        self.editor.textChanged.connect(self.update_preview)
        
        self.preview = QTextEdit()
        self.preview.setReadOnly(True)
        self.preview.setPlaceholderText("Vista previa aparecerá aquí...")
        
        splitter.addWidget(self.editor)
        splitter.addWidget(self.preview)
        splitter.setSizes([600, 600])
        
        self.setCentralWidget(splitter)

        # Barra de herramientas principal
        self.toolbar = EditorToolBar(self.editor, self)
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

        # Menú
        self.create_menus()

        # Aplicar tema inicial
        self.change_theme("Pastel Morado")

    def create_menus(self):
        menubar = self.menuBar()
        
        # Menú Archivo
        file_menu = menubar.addMenu("Archivo")
        
        new_action = QAction("Nuevo", self)
        new_action.setShortcut("Ctrl+N")
        new_action.triggered.connect(self.new_file)
        file_menu.addAction(new_action)

        open_action = QAction("Abrir", self)
        open_action.setShortcut("Ctrl+O")
        open_action.triggered.connect(self.open_file)
        file_menu.addAction(open_action)

        save_action = QAction("Guardar", self)
        save_action.setShortcut("Ctrl+S")
        save_action.triggered.connect(self.save_file)
        file_menu.addAction(save_action)

        file_menu.addSeparator()

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
        
        view_menu.addSeparator()
        
        # Modos de vista
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

    def change_theme(self, theme_name):
        if theme_name in themes:
            stylesheet = generate_stylesheet(themes[theme_name])
            self.setStyleSheet(stylesheet)

    def update_preview(self):
        try:
            text = self.editor.toPlainText()
            html = markdown.markdown(text, extensions=['extra', 'codehilite', 'tables'])
            self.preview.setHtml(html)
        except Exception:
            self.preview.setPlainText("Error al procesar vista previa")

    def new_file(self):
        self.editor.clear()

    def open_file(self):
        path, _ = QFileDialog.getOpenFileName(self, "Abrir", "", "Markdown (*.md);;Texto (*.txt);;Todos (*.*)")
        if path:
            try:
                with open(path, "r", encoding="utf-8") as f:
                    self.editor.setPlainText(f.read())
            except Exception as e:
                print(f"Error al abrir archivo: {e}")

    def save_file(self):
        path, _ = QFileDialog.getSaveFileName(self, "Guardar", "", "Markdown (*.md);;Texto (*.txt)")
        if path:
            try:
                with open(path, "w", encoding="utf-8") as f:
                    f.write(self.editor.toPlainText())
            except Exception as e:
                print(f"Error al guardar archivo: {e}")

    def export_file(self):
        try:
            Exporter.export_dialog(self, self.editor.toPlainText())
        except Exception as e:
            print(f"Error al exportar: {e}")

    def toggle_editor(self):
        self.editor.setVisible(not self.editor.isVisible())

    def toggle_preview(self):
        self.preview.setVisible(not self.preview.isVisible())
    
    def show_editor_only(self):
        self.editor.setVisible(True)
        self.preview.setVisible(False)
    
    def show_preview_only(self):
        self.editor.setVisible(False)
        self.preview.setVisible(True)
    
    def show_both(self):
        self.editor.setVisible(True)
        self.preview.setVisible(True)


if __name__ == "__main__":
    app = QApplication(sys.argv)
    window = MainWindow()
    window.show()
    sys.exit(app.exec())