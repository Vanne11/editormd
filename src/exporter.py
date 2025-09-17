from PySide6.QtWidgets import QFileDialog, QMessageBox
from docx import Document
import pypandoc


class Exporter:
    @staticmethod
    def export_dialog(parent, text):
        path, _ = QFileDialog.getSaveFileName(
            parent,
            "Exportar archivo",
            "",
            "DOCX (*.docx);;ODT (*.odt);;PDF (*.pdf);;Markdown (*.md);;Texto (*.txt)"
        )
        if not path:
            return

        if path.endswith(".docx"):
            Exporter.to_docx(path, text)
        elif path.endswith(".odt"):
            Exporter.to_odt(path, text)
        elif path.endswith(".pdf"):
            Exporter.to_pdf(path, text)
        elif path.endswith(".md"):
            with open(path, "w", encoding="utf-8") as f:
                f.write(text)
        elif path.endswith(".txt"):
            with open(path, "w", encoding="utf-8") as f:
                f.write(text)

        QMessageBox.information(parent, "Exportación", f"Archivo exportado: {path}")

    @staticmethod
    def to_docx(path, text):
        doc = Document()
        doc.add_paragraph(text)
        doc.save(path)

    @staticmethod
    def to_odt(path, text):
        pypandoc.convert_text(text, "odt", format="md", outputfile=path, extra_args=["--standalone"])

    @staticmethod
    def to_pdf(path, text):
        pypandoc.convert_text(text, "pdf", format="md", outputfile=path, extra_args=["--standalone"])
