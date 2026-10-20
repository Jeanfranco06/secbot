from unittest.mock import patch
from app.services import rag

@patch("app.services.rag.retrieve")
def test_fallback_sin_contexto(mock_retrieve):
    mock_retrieve.return_value = []
    r = rag.answer("¿Cuál es la política de viajes espaciales?")
    assert r["grounded"] is False
    assert "No encontré" in r["answer"]
    assert r["citations"] == []

@patch("app.services.rag.retrieve")
def test_respuesta_con_citas(mock_retrieve):
    mock_retrieve.return_value = [{
        "document_id": "00000000-0000-0000-0000-000000000001",
        "content": "Las contraseñas deben tener 12 caracteres.",
        "title": "Política de Contraseñas", "version": "2.1",
        "section": "4.2", "source_uri": "kb://politica",
        "score": 0.9,
    }]
    r = rag.answer("¿Cuántos caracteres debe tener mi contraseña?")
    assert r["grounded"] is True
    assert len(r["citations"]) == 1
    assert r["citations"][0]["section"] == "4.2"