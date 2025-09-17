from __future__ import annotations

import os
import sys
import tempfile
import subprocess
from dataclasses import dataclass
from typing import Optional

from PySide6.QtCore import Qt
from PySide6.QtGui import QFontDatabase
from PySide6.QtWidgets import (
    QDialog, QVBoxLayout, QGridLayout, QLabel, QComboBox, QSpinBox, QDoubleSpinBox,
    QLineEdit, QPushButton, QFileDialog, QCheckBox, QMessageBox, QWidget, QHBoxLayout
)


# -------------------------------
# Helper dataclass for options
# -------------------------------
@dataclass
class ExportOptions:
    fmt: str                 # "pdf" | "docx" | "pptx"
    font_family: str
    font_size: int
    line_height: float       # only for PDF
    page: str                # "A4" | "Letter" (PDF)
    ttf_path: Optional[str]  # PDF optional
    mermaid_png: bool
    output_path: str


class Exporter:
    """
    Exporter dialog that shells out to md_exporter.py (provided in the project root).
    MainWindow expects: Exporter.export_dialog(parent, markdown_text)
    """

    @staticmethod
    def _find_md_exporter() -> Optional[str]:
        """
        Try to resolve md_exporter.py path relative to this file or cwd.
        """
        candidates = [
            os.path.join(os.path.dirname(__file__), "md_exporter.py"),
            os.path.join(os.getcwd(), "md_exporter.py"),
        ]
        for c in candidates:
            if os.path.isfile(c):
                return c
        return None

    @staticmethod
    def _default_output_path(parent: QWidget, fmt: str) -> str:
        return os.path.join(os.path.expanduser("~"), f"export.{fmt}")

    @staticmethod
    def export_dialog(parent: QWidget, markdown_text: str) -> None:
        dlg = QDialog(parent)
        dlg.setWindowTitle("Exportar documento")
        dlg.setModal(True)

        layout = QVBoxLayout(dlg)

        grid = QGridLayout()
        row = 0

        # --- Formato ---
        grid.addWidget(QLabel("Formato"), row, 0)
        fmt_combo = QComboBox()
        fmt_combo.addItems(["pdf", "docx", "pptx"])
        grid.addWidget(fmt_combo, row, 1)
        row += 1

        # --- Tipografía ---
        grid.addWidget(QLabel("Tipografía"), row, 0)
        font_combo = QComboBox()
        font_db = QFontDatabase()
        # Add some safe defaults first
        for fam in ["DejaVu Sans", "Segoe UI", "Arial", "Helvetica", "Times New Roman", "EB Garamond", "Roboto"]:
            font_combo.addItem(fam)
        # Luego todas las fuentes del sistema
        for fam in font_db.families():
            if fam not in [font_combo.itemText(i) for i in range(font_combo.count())]:
                font_combo.addItem(fam)
        font_combo.setCurrentText("DejaVu Sans")
        grid.addWidget(font_combo, row, 1)
        row += 1

        # --- Tamaño de fuente ---
        grid.addWidget(QLabel("Tamaño (pt)"), row, 0)
        font_size = QSpinBox()
        font_size.setRange(6, 96)
        font_size.setValue(12)
        grid.addWidget(font_size, row, 1)
        row += 1

        # --- Interlineado (solo PDF) ---
        grid.addWidget(QLabel("Interlineado (PDF)"), row, 0)
        line_height = QDoubleSpinBox()
        line_height.setDecimals(2)
        line_height.setRange(1.0, 3.0)
        line_height.setSingleStep(0.1)
        line_height.setValue(1.4)
        grid.addWidget(line_height, row, 1)
        row += 1

        # --- Tamaño de página (solo PDF) ---
        grid.addWidget(QLabel("Tamaño de página (PDF)"), row, 0)
        page_combo = QComboBox()
        page_combo.addItems(["A4", "Letter"])
        grid.addWidget(page_combo, row, 1)
        row += 1

        # --- Fuente TTF (opcional PDF) ---
        grid.addWidget(QLabel("Fuente TTF (PDF opcional)"), row, 0)
        ttf_edit = QLineEdit()
        ttf_browse = QPushButton("Examinar…")
        ttf_row = QHBoxLayout()
        ttf_row.addWidget(ttf_edit)
        ttf_row.addWidget(ttf_browse)
        ttf_wrap = QWidget()
        ttf_wrap.setLayout(ttf_row)
        grid.addWidget(ttf_wrap, row, 1)
        row += 1

        # --- Mermaid PNG toggle ---
        mermaid_png = QCheckBox("Renderizar Mermaid como PNG (más compatible)")
        mermaid_png.setChecked(False)
        grid.addWidget(mermaid_png, row, 0, 1, 2)
        row += 1

        # --- Ruta de salida ---
        grid.addWidget(QLabel("Archivo de salida"), row, 0)
        out_edit = QLineEdit(Exporter._default_output_path(parent, "pdf"))
        out_browse = QPushButton("Guardar como…")
        out_row = QHBoxLayout()
        out_row.addWidget(out_edit)
        out_row.addWidget(out_browse)
        out_wrap = QWidget()
        out_wrap.setLayout(out_row)
        grid.addWidget(out_wrap, row, 1)
        row += 1

        layout.addLayout(grid)

        # Botones
        btn_row = QHBoxLayout()
        btn_export = QPushButton("Exportar")
        btn_cancel = QPushButton("Cancelar")
        btn_row.addStretch(1)
        btn_row.addWidget(btn_cancel)
        btn_row.addWidget(btn_export)
        layout.addLayout(btn_row)

        # --- Enable/disable PDF-only fields depending on format
        def refresh_pdf_fields():
            is_pdf = (fmt_combo.currentText() == "pdf")
            line_height.setEnabled(is_pdf)
            page_combo.setEnabled(is_pdf)
            ttf_edit.setEnabled(is_pdf)
            ttf_browse.setEnabled(is_pdf)

            # actualizar extensión por defecto
            current_path = out_edit.text().strip() or Exporter._default_output_path(parent, fmt_combo.currentText())
            base, _ = os.path.splitext(current_path)
            out_edit.setText(base + f".{fmt_combo.currentText()}")

        fmt_combo.currentTextChanged.connect(refresh_pdf_fields)
        refresh_pdf_fields()

        # Navegadores
        def browse_ttf():
            path, _ = QFileDialog.getOpenFileName(dlg, "Elegir fuente .ttf", "", "Fuentes TrueType (*.ttf)")
            if path:
                ttf_edit.setText(path)

        ttf_browse.clicked.connect(browse_ttf)

        def browse_output():
            fmt = fmt_combo.currentText()
            filt = {
                "pdf": "PDF (*.pdf)",
                "docx": "Documento Word (*.docx)",
                "pptx": "Presentación PowerPoint (*.pptx)",
            }[fmt]
            path, _ = QFileDialog.getSaveFileName(dlg, "Guardar como", out_edit.text(), filt)
            if path:
                # asegurar extensión
                base, ext = os.path.splitext(path)
                wanted = f".{fmt}"
                if ext.lower() != wanted:
                    path = base + wanted
                out_edit.setText(path)

        out_browse.clicked.connect(browse_output)

        def do_export():
            # Validar md_exporter
            md_exporter_path = Exporter._find_md_exporter()
            if not md_exporter_path:
                QMessageBox.critical(dlg, "No encontrado", "No se encontró md_exporter.py en el proyecto.\nColócalo junto a main.py/exporter.py.")
                return

            fmt = fmt_combo.currentText()
            opts = ExportOptions(
                fmt=fmt,
                font_family=font_combo.currentText(),
                font_size=font_size.value(),
                line_height=line_height.value(),
                page=page_combo.currentText(),
                ttf_path=ttf_edit.text().strip() or None,
                mermaid_png=mermaid_png.isChecked(),
                output_path=out_edit.text().strip() or Exporter._default_output_path(parent, fmt),
            )

            try:
                with tempfile.TemporaryDirectory() as tmp:
                    md_path = os.path.join(tmp, "input.md")
                    with open(md_path, "w", encoding="utf-8") as f:
                        f.write(markdown_text)

                    # Comando
                    cmd = [sys.executable, md_exporter_path, md_path, "--to", opts.fmt,
                           "--font-family", opts.font_family,
                           "--font-size", str(opts.font_size),
                           "--page", opts.page]
                    if opts.mermaid_png:
                        cmd.append("--mermaid-png")
                    if opts.ttf_path and opts.fmt == "pdf":
                        cmd += ["--ttf-path", opts.ttf_path]
                    if opts.fmt == "pdf":
                        cmd += ["--line-height", str(opts.line_height)]
                    cmd += ["-o", opts.output_path]

                    # Ejecutar
                    proc = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
                    if proc.returncode != 0:
                        QMessageBox.critical(
                            dlg, "Error al exportar",
                            f"Comando:\n{' '.join(cmd)}\n\nSTDOUT:\n{proc.stdout}\n\nSTDERR:\n{proc.stderr}"
                        )
                        return

                QMessageBox.information(dlg, "Éxito", f"Archivo exportado:\n{opts.output_path}")
                dlg.accept()

            except Exception as e:
                QMessageBox.critical(dlg, "Error", f"Ocurrió un error:\n{e}")

        btn_export.clicked.connect(do_export)
        btn_cancel.clicked.connect(dlg.reject)

        dlg.resize(560, 360)
        dlg.exec()
