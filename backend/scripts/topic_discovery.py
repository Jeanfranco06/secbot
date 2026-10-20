"""Clustering de consultas no resueltas para detectar vacíos de KB.
Uso: docker compose exec backend python -m scripts.topic_discovery --days 90
"""
import argparse
from datetime import datetime, timedelta
import numpy as np
from sklearn.cluster import KMeans
from sqlalchemy import text
from langchain_huggingface import HuggingFaceEmbeddings
from app.config import settings
from app.database import SessionLocal

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--days", type=int, default=90)
    ap.add_argument("--clusters", type=int, default=8)
    args = ap.parse_args()

    cutoff = datetime.utcnow() - timedelta(days=args.days)
    with SessionLocal() as db:
        rows = db.execute(text("""
            SELECT cm.content FROM chat_messages cm
            WHERE cm.role='user' AND cm.created_at >= :c
              AND cm.chat_id IN (
                SELECT ch.id FROM chat_history ch
                WHERE NOT EXISTS (SELECT 1 FROM tickets t WHERE t.chat_id = ch.id)
              )
        """), {"c": cutoff}).scalars().all()

    if len(rows) < args.clusters * 5:
        print(f"Solo {len(rows)} consultas, insuficiente para clustering")
        return

    emb = HuggingFaceEmbeddings(model_name=settings.embedding_model,
                                encode_kwargs={"normalize_embeddings": True})
    X = np.array(emb.embed_documents(rows))

    km = KMeans(n_clusters=args.clusters, n_init=10, random_state=42).fit(X)
    print(f"Clusters sobre {len(rows)} consultas:\n")
    for k in range(args.clusters):
        idx = np.where(km.labels_ == k)[0]
        sample = [rows[i] for i in idx[:5]]
        print(f"### Cluster {k} ({len(idx)} consultas)")
        for s in sample:
            print(f"  - {s[:120]}")
        print()