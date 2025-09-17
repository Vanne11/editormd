from PySide6.QtWidgets import QToolBar
from PySide6.QtGui import QAction
from PySide6.QtGui import QIcon, QTextCursor, QTextCharFormat, QFont


class EditorToolBar(QToolBar):
    def __init__(self, editor, parent=None):
        super().__init__("Barra de edición", parent)
        self.editor = editor

        # Negrita
        bold_action = QAction(QIcon("resources/icons/bold.png"), "Negrita", self)
        bold_action.triggered.connect(self.make_bold)
        self.addAction(bold_action)

        # Cursiva
        italic_action = QAction(QIcon("resources/icons/italic.png"), "Cursiva", self)
        italic_action.triggered.connect(self.make_italic)
        self.addAction(italic_action)

        # Subrayado
        underline_action = QAction(QIcon("resources/icons/underline.png"), "Subrayado", self)
        underline_action.triggered.connect(self.make_underline)
        self.addAction(underline_action)

    def make_bold(self):
        fmt = QTextCharFormat()
        fmt.setFontWeight(QFont.Bold)
        self.merge_format(fmt)

    def make_italic(self):
        fmt = QTextCharFormat()
        fmt.setFontItalic(True)
        self.merge_format(fmt)

    def make_underline(self):
        fmt = QTextCharFormat()
        fmt.setFontUnderline(True)
        self.merge_format(fmt)

    def merge_format(self, fmt):
        cursor = self.editor.textCursor()
        if not cursor.hasSelection():
            cursor.select(QTextCursor.WordUnderCursor)
        cursor.mergeCharFormat(fmt)
        self.editor.mergeCurrentCharFormat(fmt)
