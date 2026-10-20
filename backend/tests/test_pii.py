from app.services import pii

def test_email():
    assert pii.redact("Escríbeme a juan@empresa.com") == "Escríbeme a [EMAIL]"

def test_phone():
    out = pii.redact("Mi teléfono es +34 612 345 678")
    assert "[PHONE]" in out

def test_ip_private_kept():
    assert pii.redact("IP 192.168.1.10") == "IP 192.168.1.10"

def test_ip_public_redacted():
    assert "[IP]" in pii.redact("IP 8.8.8.8")

def test_jwt():
    out = pii.redact("token eyJhbGciOi.eyJzdWIiOi.SflKxwRJ")
    assert "[JWT]" in out