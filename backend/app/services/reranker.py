"""Re-ranking opcional con cross-encoder ONNX.
Modelo: BAAI/bge-reranker-v2-m3 (multilingüe, buen rendimiento en español).
Se ejecuta en CPU; ONNX reduce latencia vs torch.
"""
import os
from functools import lru_cache
from typing import List
from FlagEmbedding import FlagReranker
import logging

log = logging.getLogger(__name__)
RERANK_ENABLED = os.getenv("RERANK_ENABLED", "true").lower() == "true"
RERANK_TOP_N = int(os.getenv("RERANK_TOP_N", "4"))
RERANK_MODEL = os.getenv("RERANK_MODEL", "BAAI/bge-reranker-v2-m3")

@lru_cache(maxsize=1)
def _model():
    log.info("Cargando reranker %s", RERANK_MODEL)
    return FlagReranker(RERANK_MODEL, use_fp16=False)

def rerank(query: str, candidates: List[dict], top_n: int = None) -> List[dict]:
    if not RERANK_ENABLED or not candidates:
        return candidates[: top_n or RERANK_TOP_N]
    top_n = top_n or RERANK_TOP_N
    pairs = [[query, c["content"]] for c in candidates]
    try:
        scores = _model().compute_score(pairs, normalize=True)
    except Exception as e:
        log.warning("Reranker falló: %s. Devolviendo orden original", e)
        return candidates[:top_n]
    for c, s in zip(candidates, scores):
        c["rerank_score"] = float(s)
    return sorted(candidates, key=lambda x: x["rerank_score"], reverse=True)[:top_n]