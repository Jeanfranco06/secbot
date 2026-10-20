"""Configuración central. Única fuente de verdad para variables de entorno."""
from functools import lru_cache
from typing import Optional
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8",
        case_sensitive=False, extra="ignore",
    )

    # --- Entorno ---
    env: str = Field("production", alias="ENV")
    debug: bool = Field(False, alias="DEBUG")
    log_level: str = Field("INFO", alias="LOG_LEVEL")

    # --- Base de datos ---
    database_url: str = Field(..., alias="DATABASE_URL")
    db_pool_size: int = Field(10, alias="DB_POOL_SIZE")
    db_max_overflow: int = Field(20, alias="DB_MAX_OVERFLOW")
    db_pool_timeout: int = Field(30, alias="DB_POOL_TIMEOUT")

    # --- Redis ---
    redis_url: str = Field("redis://redis:6379/0", alias="REDIS_URL")
    cache_ttl_seconds: int = Field(300, alias="CACHE_TTL_SECONDS")

    # --- JWT ---
    jwt_algorithm: str = Field("RS256", alias="JWT_ALGORITHM")
    jwt_private_key_path: str = Field("/run/secrets/jwt_private.pem", alias="JWT_PRIVATE_KEY_PATH")
    jwt_public_key_path: str = Field("/run/secrets/jwt_public.pem", alias="JWT_PUBLIC_KEY_PATH")
    jwt_kid: str = Field("k1", alias="JWT_KID")
    jwt_issuer: str = Field("secbot", alias="JWT_ISSUER")
    jwt_access_ttl_min: int = Field(60, alias="JWT_ACCESS_TTL_MIN")
    jwt_refresh_ttl_days: int = Field(7, alias="JWT_REFRESH_TTL_DAYS")

    # --- LLM / Embeddings ---
    ollama_base_url: str = Field("http://ollama:11434", alias="OLLAMA_BASE_URL")
    llm_model: str = Field("llama3.2:3b-instruct-q4_K_M", alias="LLM_MODEL")
    llm_timeout_seconds: int = Field(30, alias="LLM_TIMEOUT_SECONDS")
    llm_max_retries: int = Field(2, alias="LLM_MAX_RETRIES")
    embedding_model: str = Field("intfloat/multilingual-e5-large", alias="EMBEDDING_MODEL")

    # --- RAG ---
    retrieval_top_k: int = Field(8, alias="RETRIEVAL_TOP_K")
    retrieval_min_score: float = Field(0.75, alias="RETRIEVAL_MIN_SCORE")
    rerank_enabled: bool = Field(True, alias="RERANK_ENABLED")
    rerank_top_n: int = Field(4, alias="RERANK_TOP_N")
    rerank_model: str = Field("BAAI/bge-reranker-v2-m3", alias="RERANK_MODEL")
    context_max_tokens: int = Field(3000, alias="CONTEXT_MAX_TOKENS")

    # --- Clasificador ---
    incident_confidence_threshold: float = Field(0.70, alias="INCIDENT_CONFIDENCE_THRESHOLD")

    # --- n8n ---
    n8n_webhook_url: str = Field("http://n8n:5678/webhook/security-incident", alias="N8N_WEBHOOK_URL")
    n8n_secret: str = Field("cambiar", alias="N8N_SECRET")
    n8n_timeout_seconds: int = Field(5, alias="N8N_TIMEOUT_SECONDS")

    # --- SMTP ---
    smtp_host: Optional[str] = Field(None, alias="SMTP_HOST")
    smtp_port: int = Field(587, alias="SMTP_PORT")
    smtp_user: Optional[str] = Field(None, alias="SMTP_USER")
    smtp_password: Optional[str] = Field(None, alias="SMTP_PASSWORD")
    smtp_from: str = Field("secbot@empresa.local", alias="SMTP_FROM")
    security_email: str = Field("security@empresa.local", alias="SECURITY_EMAIL")

    # --- Observabilidad ---
    otel_endpoint: Optional[str] = Field(None, alias="OTEL_EXPORTER_OTLP_ENDPOINT")
    metrics_enabled: bool = Field(True, alias="METRICS_ENABLED")

    # --- SIEM ---
    siem_enabled: bool = Field(False, alias="SIEM_ENABLED")
    siem_type: str = Field("wazuh", alias="SIEM_TYPE")
    siem_endpoint: Optional[str] = Field(None, alias="SIEM_ENDPOINT")
    siem_token: Optional[str] = Field(None, alias="SIEM_TOKEN")

    # --- SSO ---
    sso_enabled: bool = Field(False, alias="SSO_ENABLED")
    sso_default_role: str = Field("employee", alias="SSO_DEFAULT_ROLE")
    sso_frontend_url: str = Field("http://localhost:3000", alias="SSO_FRONTEND_URL")

    # --- Retención ---
    retention_chat_days: int = Field(365, alias="RETENTION_CHAT_DAYS")
    retention_ticket_days: int = Field(730, alias="RETENTION_TICKET_DAYS")
    retention_audit_days: int = Field(1825, alias="RETENTION_AUDIT_DAYS")

    # --- Reportes ---
    export_dir: str = Field("/tmp/reports", alias="EXPORT_DIR")
    export_max_age_days: int = Field(90, alias="EXPORT_MAX_AGE_DAYS")
    export_max_size_mb: int = Field(50, alias="EXPORT_MAX_SIZE_MB")

    # --- Multi-tenant (opcional) ---
    multi_tenant_enabled: bool = Field(False, alias="MULTI_TENANT_ENABLED")

    # --- Rate limiting ---
    ratelimit_chat_per_min: int = Field(30, alias="RATELIMIT_CHAT_PER_MIN")
    ratelimit_login_per_min: int = Field(5, alias="RATELIMIT_LOGIN_PER_MIN")

    # LangChain
    query_rewrite_enabled: bool = Field(True, alias="QUERY_REWRITE_ENABLED")
    conversation_memory_enabled: bool = Field(True, alias="CONVERSATION_MEMORY_ENABLED")
    summary_trigger_messages: int = Field(20, alias="SUMMARY_TRIGGER_MESSAGES")
    agent_enabled: bool = Field(False, alias="AGENT_ENABLED")

    # --- CORS ---
    cors_origins: str = Field("http://localhost:3000", alias="CORS_ORIGINS")

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def is_production(self) -> bool:
        return self.env.lower() == "production"

    @field_validator("log_level")
    @classmethod
    def _valid_log_level(cls, v: str) -> str:
        allowed = {"DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"}
        if v.upper() not in allowed:
            raise ValueError(f"log_level debe ser uno de {allowed}")
        return v.upper()


@lru_cache(maxsize=1)
def _load() -> Settings:
    return Settings()


settings = _load()