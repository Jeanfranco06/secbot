from app.services import reranker

def test_rerank_orden():
    cands = [
        {"content": "No relevante", "id": 1},
        {"content": "Muy relevante sobre política", "id": 2},
        {"content": "Algo relevante", "id": 3},
    ]
    out = reranker.rerank("política de contraseñas", cands, top_n=2)
    assert len(out) == 2
    assert "rerank_score" in out[0]