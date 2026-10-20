"""Evalúa el pipeline RAG con RAGAS.
Uso:
  docker compose exec backend python -m ops.rag_eval.run_eval
"""
import json
import os
from pathlib import Path
from datasets import Dataset
from ragas import evaluate
from ragas.metrics import faithfulness, answer_relevancy, context_precision, context_recall
from langchain_ollama import OllamaLLM, OllamaEmbeddings

from app.services import rag
from app.config import settings

GOLDEN = Path(__file__).parent / "golden.jsonl"

def _run_pipeline(q: str):
    hits = rag.retrieve(q)
    contexts = [h["content"] for h in hits]
    ans = rag.answer(q)
    return ans["answer"], contexts

def main():
    rows = [json.loads(l) for l in GOLDEN.read_text().splitlines() if l.strip()]
    answers, contexts = [], []
    for r in rows:
        a, c = _run_pipeline(r["question"])
        answers.append(a); contexts.append(c)

    ds = Dataset.from_dict({
        "question": [r["question"] for r in rows],
        "answer": answers,
        "contexts": contexts,
        "ground_truth": [r["ground_truth"] for r in rows],
    })

    evaluator_llm = OllamaLLM(base_url=settings.ollama_base_url, model=settings.llm_model)
    evaluator_emb = OllamaEmbeddings(base_url=settings.ollama_base_url, model=settings.llm_model)

    result = evaluate(
        ds,
        metrics=[faithfulness, answer_relevancy, context_precision, context_recall],
        llm=evaluator_llm,
        embeddings=evaluator_emb,
    )
    print(result)
    out = Path("ops/rag_eval/last_result.json")
    out.write_text(json.dumps(result.to_pandas().to_dict(orient="records"), indent=2))
    print(f"Guardado en {out}")

if __name__ == "__main__":
    main()