from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str
    jwt_secret: str
    jwt_algorithm: str = "HS256"
    jwt_access_ttl_min: int = 60
    jwt_refresh_ttl_days: int = 7
    ollama_base_url: str = "http://ollama:11434"
    llm_model: str = "llama3.2:3b-instruct-q4_K_M"
    embedding_model: str = "intfloat/multilingual-e5-large"
    n8n_webhook_url: str = "http://n8n:5678/webhook/security-incident"
    n8n_secret: str = "cambiar"
    retrieval_top_k: int = 8
    retrieval_min_score: float = 0.75
    incident_confidence_threshold: float = 0.70
    rerank_enabled: bool = True
    rerank_top_n: int = 4
    cache_ttl_seconds: int = 300

    class Config:
        env_file = ".env"

settings = Settings()