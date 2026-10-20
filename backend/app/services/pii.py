import re

PII_PATTERNS = [
    (re.compile(r"\b[\w\.-]+@[\w\.-]+\.\w+\b"), "[EMAIL]"),
    (re.compile(r"\b(?:\+?\d{1,3}[\s-]?)?(?:\d[\s-]?){8,13}\b"), "[PHONE]"),
    (re.compile(r"\b(?:\d[ -]*?){13,16}\b"), "[CARD]"),
    (re.compile(r"\b(?:\d{8}[A-Z]|\d{7}[A-Z0-9])\b"), "[ID]"),
]

def redact(text: str) -> str:
    if not text:
        return text
    for pattern, replacement in PII_PATTERNS:
        text = pattern.sub(replacement, text)
    return text