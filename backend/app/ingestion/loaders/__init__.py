from pathlib import Path
from langchain_community.document_loaders import (
    PyPDFLoader, Docx2txtLoader, TextLoader,
)
from langchain_community.document_loaders import BSHTMLLoader


def load_document(path: str):
    """Carga un archivo y devuelve una lista de Document (LangChain)."""
    ext = Path(path).suffix.lower()
    if ext == ".pdf":
        return PyPDFLoader(path).load()
    if ext in (".docx", ".doc"):
        return Docx2txtLoader(path).load()
    if ext in (".md", ".txt"):
        return TextLoader(path, encoding="utf-8").load()
    if ext in (".html", ".htm"):
        return BSHTMLLoader(path).load()
    raise ValueError(f"Formato no soportado: {ext}")