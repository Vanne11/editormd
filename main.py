import sys
import markdown
import pypandoc

from PySide6.QtWidgets import (
    QApplication, QMainWindow, QTextEdit, QFileDialog,
    QSplitter, QWidget, QVBoxLayout, QTextBrowser
)
from PySide6.QtCore import Qt
from PySide6.QtGui import QAction

from themes import generate_stylesheet, themes


class MarkdownEditor(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("MDNote - Markdown Editor")

        # Splitter (editor izquierda / vista previa derecha)
        splitter = QSplitter(Qt.Horizontal)

        # Editor de texto
        self.editor = QTextEdit()
        self.editor.textChanged.connect(self.update_preview)
        splitter.addWidget(self.editor)

        # Vista previa en HTML
        self.preview = QTextBrowser()
        splitter.addWidget(self.preview)

        # Layout principal
        container = QWidget()
        layout = QVBoxLayout(container)
        layout.addWidget(splitter)
        self.setCentralWidget(container)

        # Menú
        menubar = self.menuBar()
        file_menu = menubar.addMenu("Archivo")
        theme_menu = menubar.addMenu("Temas")

        # Opciones de archivo
        open_action = QAction("Abrir", self)
        open_action.triggered.connect(self.open_file)
        file_menu.addAction(open_action)

        save_action = QAction("Guardar", self)
        save_action.triggered.connect(self.save_file)
        file_menu.addAction(save_action)

        new_action = QAction("Nuevo", self)
        new_action.triggered.connect(self.new_file)
        file_menu.addAction(new_action)

        export_action = QAction("Exportar", self)
        export_action.triggered.connect(self.export_file)
        file_menu.addAction(export_action)

        # Selector de temas
        for theme_name in themes.keys():
            action = QAction(theme_name, self)
            action.triggered.connect(lambda checked, t=theme_name: self.change_theme(t))
            theme_menu.addAction(action)

        # Estilo inicial
        self.change_theme("Oscuro")

    def update_preview(self):
        """Convierte Markdown en HTML y lo muestra en la vista previa"""
        md_text = self.editor.toPlainText()
        html = markdown.markdown(md_text, extensions=["fenced_code", "tables"])
        self.preview.setHtml(html)

    def open_file(self):
        path, _ = QFileDialog.getOpenFileName(self, "Abrir archivo", "", "Markdown Files (*.md)")
        if path:
            with open(path, "r", encoding="utf-8") as f:
                self.editor.setPlainText(f.read())

    def save_file(self):
        path, _ = QFileDialog.getSaveFileName(self, "Guardar archivo", "", "Markdown Files (*.md)")
        if path:
            with open(path, "w", encoding="utf-8") as f:
                f.write(self.editor.toPlainText())

    def new_file(self):
        self.editor.clear()

    def export_file(self):
        path, _ = QFileDialog.getSaveFileName(
            self, "Exportar archivo", "",
            "PDF (*.pdf);;Word (*.docx);;LibreOffice ODT (*.odt);;Texto (*.txt)"
        )
        if path:
            text = self.editor.toPlainText()
            ext = path.split(".")[-1].lower()
            try:
                pypandoc.convert_text(
                    text, ext, format="md",
                    outputfile=path, extra_args=["--standalone"]
                )
            except Exception as e:
                print("Error al exportar:", e)

    def change_theme(self, theme_name):
        """Cambia el tema según lo elegido"""
        palette = themes[theme_name]
        self.setStyleSheet(generate_stylesheet(palette))


if __name__ == "__main__":
    app = QApplication(sys.argv)
    window = MarkdownEditor()
    window.resize(1000, 600)
    window.show()
    sys.exit(app.exec())
