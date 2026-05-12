"""
RAG (Retrieval-Augmented Generation) utilities using pgvector for semantic search.

Embeddings are generated with sentence-transformers (all-MiniLM-L6-v2, 384 dims).
Vectors are stored in the ContextVector model and queried via pgvector cosine similarity.
"""
import logging
from typing import List

import numpy as np
from sentence_transformers import SentenceTransformer
from pgvector.django import CosineDistance

logger = logging.getLogger(__name__)

_model: SentenceTransformer | None = None
CHUNK_SIZE = 500
CHUNK_OVERLAP = 50
TOP_K = 5


def _get_model() -> SentenceTransformer:
    global _model
    if _model is None:
        _model = SentenceTransformer("all-MiniLM-L6-v2")
    return _model


def embed_text(text: str) -> List[float]:
    model = _get_model()
    embedding = model.encode(text, normalize_embeddings=True)
    return embedding.tolist()


def _chunk_text(text: str) -> List[str]:
    words = text.split()
    chunks: List[str] = []
    start = 0
    while start < len(words):
        end = start + CHUNK_SIZE
        chunk = " ".join(words[start:end])
        chunks.append(chunk)
        start += CHUNK_SIZE - CHUNK_OVERLAP
    return chunks


def index_chapter(chapter) -> None:
    from apps.analyses.models import ContextVector

    ContextVector.objects.filter(chapter=chapter).delete()

    if not chapter.content.strip():
        return

    chunks = _chunk_text(chapter.content)
    vectors = []
    for chunk in chunks:
        if not chunk.strip():
            continue
        embedding = embed_text(chunk)
        vectors.append(
            ContextVector(
                project=chapter.project,
                chapter=chapter,
                text_excerpt=chunk,
                embedding=embedding,
            )
        )

    ContextVector.objects.bulk_create(vectors)
    logger.info("Indexed %d chunks for chapter %d", len(vectors), chapter.pk)


def retrieve_context(query_text: str, project, top_k: int = TOP_K) -> str:
    from apps.analyses.models import ContextVector

    if not ContextVector.objects.filter(project=project).exists():
        return ""

    query_embedding = embed_text(query_text)

    results = (
        ContextVector.objects
        .filter(project=project)
        .annotate(distance=CosineDistance("embedding", query_embedding))
        .order_by("distance")[:top_k]
    )

    excerpts = [r.text_excerpt for r in results]
    return "\n\n---\n\n".join(excerpts)
