from PySide6.QtWidgets import (QToolBar, QComboBox, QSpinBox, QColorDialog, 
                               QInputDialog, QMessageBox, QWidget, QHBoxLayout, QLabel)
from PySide6.QtGui import QAction, QIcon, QTextCursor, QTextCharFormat, QFont, QColor
from PySide6.QtCore import Qt


class EditorToolBar(QToolBar):
    def __init__(self, editor, parent=None):
        super().__init__("Barra de edición", parent)
        self.editor = editor
        self.setup_toolbar()

    def setup_toolbar(self):
        # Sección de formato de texto
        self.add_text_formatting()
        self.addSeparator()
        
        # Sección de encabezados
        self.add_headers()
        self.addSeparator()
        
        # Sección de listas
        self.add_lists()
        self.addSeparator()
        
        # Sección de enlaces e imágenes
        self.add_links_images()
        self.addSeparator()
        
        # Sección de elementos especiales
        self.add_special_elements()

    def add_text_formatting(self):
        """Herramientas de formato básico"""
        # Negrita
        bold_action = QAction("B", self)
        bold_action.setToolTip("Negrita")
        bold_action.triggered.connect(self.make_bold)
        self.addAction(bold_action)

        # Cursiva
        italic_action = QAction("I", self)
        italic_action.setToolTip("Cursiva")
        italic_action.triggered.connect(self.make_italic)
        self.addAction(italic_action)

        # Código inline
        code_action = QAction("< >", self)
        code_action.setToolTip("Código")
        code_action.triggered.connect(self.make_inline_code)
        self.addAction(code_action)

        # Tachado
        strike_action = QAction("~~", self)
        strike_action.setToolTip("Tachado")
        strike_action.triggered.connect(self.make_strikethrough)
        self.addAction(strike_action)

    def add_headers(self):
        """Herramientas para encabezados"""
        header_combo = QComboBox()
        header_combo.addItems(["Normal", "H1", "H2", "H3", "H4", "H5", "H6"])
        header_combo.setToolTip("Encabezado")
        header_combo.currentTextChanged.connect(self.apply_header)
        self.addWidget(header_combo)

    def add_lists(self):
        """Herramientas para listas"""
        # Lista con viñetas
        bullet_action = QAction("• ", self)
        bullet_action.setToolTip("Lista")
        bullet_action.triggered.connect(self.make_bullet_list)
        self.addAction(bullet_action)

        # Lista numerada
        number_action = QAction("1.", self)
        number_action.setToolTip("Lista numerada")
        number_action.triggered.connect(self.make_numbered_list)
        self.addAction(number_action)

        # Lista de tareas
        task_action = QAction("☐", self)
        task_action.setToolTip("Tarea")
        task_action.triggered.connect(self.make_task_list)
        self.addAction(task_action)

    def add_links_images(self):
        """Herramientas para enlaces e imágenes"""
        # Enlace
        link_action = QAction("🔗", self)
        link_action.setToolTip("Enlace")
        link_action.triggered.connect(self.insert_link)
        self.addAction(link_action)

        # Imagen
        image_action = QAction("🖼️", self)
        image_action.setToolTip("Imagen")
        image_action.triggered.connect(self.insert_image)
        self.addAction(image_action)

    def add_special_elements(self):
        """Elementos especiales"""
        # Cita
        quote_action = QAction("❝", self)
        quote_action.setToolTip("Cita")
        quote_action.triggered.connect(self.make_blockquote)
        self.addAction(quote_action)

        # Bloque de código
        code_block_action = QAction("{ }", self)
        code_block_action.setToolTip("Código")
        code_block_action.triggered.connect(self.insert_code_block)
        self.addAction(code_block_action)

        # Tabla
        table_action = QAction("📊", self)
        table_action.setToolTip("Tabla")
        table_action.triggered.connect(self.insert_table)
        self.addAction(table_action)

    def insert_around_selection(self, before, after=""):
        """Inserta texto antes y después de la selección"""
        cursor = self.editor.textCursor()
        
        if cursor.hasSelection():
            selected = cursor.selectedText()
            replacement = f"{before}{selected}{after}"
        else:
            replacement = f"{before}{after}"
            
        cursor.insertText(replacement)
        
        # Posicionar cursor para texto nuevo
        if not cursor.hasSelection() and after:
            for _ in range(len(after)):
                cursor.movePosition(QTextCursor.Left)
        
        self.editor.setTextCursor(cursor)

    def insert_at_line_start(self, prefix):
        """Inserta texto al inicio de la línea"""
        cursor = self.editor.textCursor()
        cursor.movePosition(QTextCursor.StartOfLine)
        cursor.insertText(prefix)
        self.editor.setTextCursor(cursor)

    # Métodos de formato
    def make_bold(self):
        self.insert_around_selection("**", "**")

    def make_italic(self):
        self.insert_around_selection("*", "*")

    def make_strikethrough(self):
        self.insert_around_selection("~~", "~~")

    def make_inline_code(self):
        self.insert_around_selection("`", "`")

    def apply_header(self, level):
        """Aplica el nivel de encabezado seleccionado"""
        cursor = self.editor.textCursor()
        cursor.movePosition(QTextCursor.StartOfLine)
        
        # Remover encabezados existentes
        line_text = cursor.block().text()
        cleaned_text = line_text.lstrip('#').strip()
        
        if level == "Normal":
            new_text = cleaned_text
        else:
            header_level = int(level[1])  # H1 -> 1, H2 -> 2, etc.
            new_text = "#" * header_level + " " + cleaned_text
            
        # Seleccionar toda la línea y reemplazar
        cursor.select(QTextCursor.LineUnderCursor)
        cursor.insertText(new_text)
        self.editor.setTextCursor(cursor)

    def make_bullet_list(self):
        self.insert_at_line_start("- ")

    def make_numbered_list(self):
        self.insert_at_line_start("1. ")

    def make_task_list(self):
        self.insert_at_line_start("- [ ] ")

    def make_blockquote(self):
        self.insert_at_line_start("> ")

    def insert_link(self):
        """Inserta un enlace"""
        url, ok = QInputDialog.getText(
            self.parent(), 
            'Enlace', 
            'URL:', 
            text='https://'
        )
        
        if ok and url:
            text, ok2 = QInputDialog.getText(
                self.parent(), 
                'Texto', 
                'Texto del enlace:'
            )
            if ok2:
                link_text = f"[{text}]({url})"
                cursor = self.editor.textCursor()
                cursor.insertText(link_text)

    def insert_image(self):
        """Inserta una imagen"""
        url, ok = QInputDialog.getText(
            self.parent(), 
            'Imagen', 
            'URL:', 
            text='https://'
        )
        
        if ok and url:
            alt_text, ok2 = QInputDialog.getText(
                self.parent(), 
                'Descripción', 
                'Alt text:'
            )
            
            if ok2:
                image_text = f"![{alt_text}]({url})"
                cursor = self.editor.textCursor()
                cursor.insertText(image_text)

    def insert_code_block(self):
        """Inserta un bloque de código"""
        language, ok = QInputDialog.getText(
            self.parent(), 
            'Código', 
            'Lenguaje:'
        )
        
        cursor = self.editor.textCursor()
        if ok:
            code_block = f"```{language}\n\n```"
            cursor.insertText(code_block)
            # Posicionar cursor en el medio
            cursor.movePosition(QTextCursor.Left, QTextCursor.MoveAnchor, 4)
            self.editor.setTextCursor(cursor)

    def insert_table(self):
        """Inserta una tabla básica"""
        rows, ok1 = QInputDialog.getInt(
            self.parent(), 
            'Tabla', 
            'Filas:', 
            value=3, min=2, max=10
        )
        
        if ok1:
            cols, ok2 = QInputDialog.getInt(
                self.parent(), 
                'Tabla', 
                'Columnas:', 
                value=3, min=2, max=8
            )
            
            if ok2:
                # Crear tabla
                header = "| " + " | ".join([f"Col {i+1}" for i in range(cols)]) + " |"
                separator = "| " + " | ".join(["---" for _ in range(cols)]) + " |"
                
                table_lines = [header, separator]
                
                for i in range(rows - 1):
                    row = "| " + " | ".join([" " for _ in range(cols)]) + " |"
                    table_lines.append(row)
                
                table_text = "\n" + "\n".join(table_lines) + "\n"
                
                cursor = self.editor.textCursor()
                cursor.insertText(table_text)