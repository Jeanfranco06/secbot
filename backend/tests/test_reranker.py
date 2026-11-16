from unittest.mock import patch, MagicMock
from app.services import reranker

def test_rerank_orden():
    cands = [
        {"content": "No relevante", "id": 1},
        {"content": "Muy relevante sobre política", "id": 2},
        {"content": "Algo relevante", "id": 3},
    ]
    with patch("app.services.reranker.RERANK_ENABLED", True):
        with patch("app.services.reranker._model") as mock_get_model:
            mock_model = MagicMock()
            mock_model.compute_score.return_value = [0.1, 0.9, 0.5]
            mock_get_model.return_value = mock_model
            out = reranker.rerank("política de contraseñas", cands, top_n=2)
            assert len(out) == 2
            assert "rerank_score" in out[0]
            assert out[0]["id"] == 2
