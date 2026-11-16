from app.services import classifier
from unittest.mock import patch

def test_phishing_keyword():
    r = classifier.classify("Recibí un correo sospechoso de phishing")
    assert r["is_incident"] is True
    assert r["category"] == "phishing"

def test_not_incident():
    with patch.object(classifier, "_llm") as mock_llm:
        mock_instance = mock_llm.return_value
        mock_instance.invoke.return_value = '{"is_incident": false, "category": "otro", "severity": "P4", "confidence": 0.2}'
        r = classifier.classify("¿Cómo cambio mi contraseña?")
        assert r["confidence"] < 1.0
