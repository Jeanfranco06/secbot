"""Defensa contra prompt injection y jailbreak.
Estrategia: heurísticas + normalización + bloqueo.
"""
import re
import logging
from dataclasses import dataclass

log = logging.getLogger(__name__)

# Patrones de inyección típicos
PATTERNS = [
    re.compile(r"ignora\s+(todas\s+)?(las\s+)?(instrucciones|reglas)", re.IGNORECASE),
    re.compile(r"ignore\s+(all\s+)?(previous\s+)?(instructions|rules)", re.IGNORECASE),
    re.compile(r"(system|sistema)\s*:\s*", re.IGNORECASE),
    re.compile(r"<\|?im_start\|?>", re.IGNORECASE),
    re.compile(r"<\|?im_end\|?>", re.IGNORECASE),
    re.compile(r"###\s*(system|user|assistant)", re.IGNORECASE),
    re.compile(r"jailbreak|DAN\s+mode|developer\s+mode", re.IGNORECASE),
    re.compile(r"revela\s+(tu|el)\s+prompt", re.IGNORECASE),
    re.compile(r"reveal\s+(your\s+)?prompt", re.IGNORECASE),
    re.compile(r"act[úu]a\s+como\s+(si\s+fueras|root|admin)", re.IGNORECASE),
    re.compile(r"print\s*\(\s*['\"]system['\"]", re.IGNORECASE),
]

MAX_LEN = 4000
MAX_NEWLINES = 200


@dataclass
class GuardResult:
    ok: bool
    reason: str | None = None
    sanitized: str | None = None


def check(message: str) -> GuardResult:
    if not message or not message.strip():
        return GuardResult(ok=False, reason="empty")

    if len(message) > MAX_LEN:
        return GuardResult(ok=False, reason="too_long")

    if message.count("\n") > MAX_NEWLINES:
        return GuardResult(ok=False, reason="too_many_lines")

    # Caracteres de control (excepto \n, \r, \t)
    if re.search(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]", message):
        return GuardResult(ok=False, reason="control_chars")

    for p in PATTERNS:
        if p.search(message):
            log.warning("prompt_injection_detected", extra={"pattern": p.pattern[:40]})
            return GuardResult(ok=False, reason="injection_pattern")

    return GuardResult(ok=True, sanitized=message.strip())