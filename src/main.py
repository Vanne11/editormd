import sys
from PySide6.QtWidgets import QApplication, QMainWindow, QFileDialog, QDockWidget, QTextEdit
from PySide6.QtWidgets import QToolBar
from PySide6.QtGui import QAction
from PySide6.QtCore import Qt
from editor import Editor
from toolbar import EditorToolBar
from exporter import Exporter


class MainWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("Pastel Editor - Estilo VS Code")
        self.resize(1200, 800)

        # Editor central
        self.editor = Editor()
        self.setCentralWidget(self.editor)

        # Barra de herramientas
        self.toolbar = EditorToolBar(self.editor, self)
        self.addToolBar(Qt.TopToolBarArea, self.toolbar)

        # Dock lateral (puede ocultarse)
        self.dock = QDockWidget("Panel lateral", self)
        self.dock.setAllowedAreas(Qt.LeftDockWidgetArea | Qt.RightDockWidgetArea)
        self.dock.setWidget(QTextEdit("Aquí puedes poner notas, archivos o un índice."))
        self.addDockWidget(Qt.LeftDockWidgetArea, self.dock)

        # Menú
        menubar = self.menuBar()

        # Archivo
        file_menu = menubar.addMenu("Archivo")

        open_action = QAction("Abrir", self)
        open_action.triggered.connect(self.open_file)
        file_menu.addAction(open_action)

        save_action = QAction("Guardar", self)
        save_action.triggered.connect(self.save_file)
        file_menu.addAction(save_action)

        export_action = QAction("Exportar", self)
        export_action.triggered.connect(self.export_file)
        file_menu.addAction(export_action)

        toggle_dock_action = QAction("Mostrar/Ocultar panel", self)
        toggle_dock_action.triggered.connect(self.toggle_dock)
        file_menu.addAction(toggle_dock_action)

        # Estilos
        with open("resources/style.qss", "r") as f:
            self.setStyleSheet(f.read())

    def open_file(self):
        path, _ = QFileDialog.getOpenFileName(self, "Abrir archivo", "", "Textos (*.txt *.md)")
        if path:
            with open(path, "r", encoding="utf-8") as f:
                self.editor.setPlainText(f.read())

    def save_file(self):
        path, _ = QFileDialog.getSaveFileName(self, "Guardar archivo", "", "Textos (*.txt *.md)")
        if path:
            with open(path, "w", encoding="utf-8") as f:
                f.write(self.editor.toPlainText())

    def export_file(self):
        Exporter.export_dialog(self, self.editor.toPlainText())

    def toggle_dock(self):
        self.dock.setVisible(not self.dock.isVisible())


if __name__ == "__main__":
    app = QApplication(sys.argv)
    window = MainWindow()
    window.show()
    sys.exit(app.exec())
