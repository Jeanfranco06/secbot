"""Versionado de KB: detecta cambios, marca obsoletos, invalida caché."""
import hashlib
import logging
from pathlib import Path

from sqlalchemy.orm import Session
from sqlalchemy import text

from app.services import cache

log = logging.getLogger(__name__)


def file_checksum(path: str) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for block in iter(lambda: f.read(65536), b""):
            h.update(block)
    return h.hexdigest()


def document_exists(db: Session, title: str, version: str, checksum: str) -> bool:
    row = db.execute(text("""
        SELECT 1 FROM kb_documents
        WHERE title = :t AND version = :v AND checksum = :c
    """), {"t": title, "v": version, "c": checksum}).first()
    return row is not None


def obsolete_previous(db: Session, title: str) -> int:
    res = db.execute(text("""
        UPDATE kb_documents
        SET status = 'obsolete', updated_at = now()
        WHERE title = :t AND status = 'active'
    """), {"t": title})
    db.commit()
    return res.rowcount


def after_ingest(db: Session | None = None) -> None:
    """Invalida caché tras cambios en KB."""
    cache.invalidate_all()
    log.info("kb_cache_invalidated")