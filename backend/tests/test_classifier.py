from app.services import classifier

def test_phishing_keyword():
    r = classifier.classify("Recibí un correo sospechoso de phishing")
    assert r["is_incident"] is True
    assert r["category"] == "phishing"

def test_not_incident():
    r = classifier.classify("¿Cómo cambio mi contraseña?")
    # No debe clasificarse como incidente con alta confianza
    assert r["confidence"] < 1.0