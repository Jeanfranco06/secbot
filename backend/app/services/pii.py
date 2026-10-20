"""Detección y redacción de PII en español e inglés.
Cubre: email, teléfono, tarjeta, IBAN, DNI/NIE, NIF, IP, URL con credenciales,
claves API, JWT, password en texto.
"""
import re
from typing import List, Tuple

PATTERNS: List[Tuple[re.Pattern, str]] = [
    # JWT
    (re.compile(r"\beyJ[A-Za-z0-9_\-]+\.[A-Za-z0-9_\-]+\.[A-Za-z0-9_\-]+\b"), "[JWT]"),
    # API keys comunes
    (re.compile(r"\b(?:sk|pk|api|token)[-_][A-Za-z0-9]{16,}\b"), "[API_KEY]"),
    (re.compile(r"\bAKIA[0-9A-Z]{16}\b"), "[AWS_KEY]"),
    (re.compile(r"\bghp_[A-Za-z0-9]{20,}\b"), "[GITHUB_TOKEN]"),
    # IBAN
    (re.compile(r"\b[A-Z]{2}\d{2}[A-Z0-9]{10,30}\b"), "[IBAN]"),
    # Tarjeta de crédito (Luhn no verificado, solo forma)
    (re.compile(r"\b(?:\d[ -]?){13,16}\b"), "[CARD]"),
    # DNI/NIE España
    (re.compile(r"\b\d{8}[A-Za-z]\b"), "[DNI]"),
    (re.compile(r"\b[XYZ]\d{7}[A-Za-z]\b"), "[NIE]"),
    # Teléfono (internacional, permisivo)
    (re.compile(r"\b(?:\+\d{1,3}[\s.-]?)?(?:\(\d{1,4}\)[\s.-]?)?\d{2,4}(?:[\s.-]?\d{2,4}){2,4}\b"), "[PHONE]"),
    # Email
    (re.compile(r"\b[\w\.\-\+]+@[\w\.\-]+\.\w+\b"), "[EMAIL]"),
    # URL con credenciales
    (re.compile(r"https?://[^/\s:@]+:[^/\s:@]+@[^\s]+"), "[URL_WITH_CREDS]"),
    # Password en texto
    (re.compile(r"(?i)\b(?:password|contrase[ñn]a|pwd|pass)\s*[:=]\s*\S+"), "[PASSWORD]"),
    # IPv4
    (re.compile(r"\b(?:\d{1,3}\.){3}\d{1,3}\b"), "[IP]"),
]

# Excluir IPs privadas/locales para no redactar direcciones de documentación
PRIVATE_IP = re.compile(r"\b(?:10\.|172\.(?:1[6-9]|2\d|3[01])\.|192\.168\.|127\.|0\.)")


def redact(text: str | None) -> str | None:
    if not text:
        return text
    result = text
    for pattern, replacement in PATTERNS:
        if replacement == "[IP]":
            def _ip_sub(m):
                return m.group(0) if PRIVATE_IP.match(m.group(0)) else replacement
            result = pattern.sub(_ip_sub, result)
        else:
            result = pattern.sub(replacement, result)
    return result


def contains_pii(text: str) -> bool:
    if not text:
        return False
    for pattern, _ in PATTERNS:
        if pattern.search(text):
            return True
    return False


def redact_many(*texts: str | None) -> list[str | None]:
    return [redact(t) for t in texts]