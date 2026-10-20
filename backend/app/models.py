"""Modelos SQLAlchemy consolidados Fase 0–3."""
import uuid
from datetime import datetime

from sqlalchemy import (
    Column, String, Boolean, DateTime, Integer, BigInteger, ForeignKey,
    Text, Numeric, Date, UniqueConstraint, Index,
)
from sqlalchemy.dialects.postgresql import UUID, JSONB, INET
from sqlalchemy.orm import relationship

from app.database import Base


def _uuid():
    return uuid.uuid4()


# --- Usuarios y RBAC ---

class User(Base):
    __tablename__ = "users"
    id = Column(UUID(as_uuid=True), primary_key=True, default=_uuid)
    email = Column(String, unique=True, nullable=False, index=True)
    full_name = Column(String, nullable=False)
    password_hash = Column(String, nullable=True)  # nullable para SSO puro
    is_active = Column(Boolean, default=True, nullable=False)
    jurisdiction = Column(String(32), default="default", nullable=False)
    tenant_id = Column(UUID(as_uuid=True), nullable=True, index=True)
    last_login_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    roles = relationship(
        "Role",
        secondary="user_roles",
        primaryjoin="User.id == UserRole.user_id",
        secondaryjoin="Role.id == UserRole.role_id",
        viewonly=True,
    )


class Role(Base):
    __tablename__ = "roles"
    id = Column(Integer, primary_key=True)
    name = Column(String, unique=True, nullable=False)
    description = Column(String)


class UserRole(Base):
    __tablename__ = "user_roles"
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    role_id = Column(Integer, ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True)
    granted_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    granted_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))


class Permission(Base):
    __tablename__ = "permissions"
    id = Column(Integer, primary_key=True)
    code = Column(String(64), unique=True, nullable=False)
    description = Column(String(255))


class RolePermission(Base):
    __tablename__ = "role_permissions"
    role_id = Column(Integer, ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True)
    permission_id = Column(Integer, ForeignKey("permissions.id", ondelete="CASCADE"), primary_key=True)


class Session(Base):
    __tablename__ = "sessions"
    id = Column(UUID(as_uuid=True), primary_key=True, default=_uuid)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    refresh_jti = Column(String(64), unique=True, nullable=False)
    ip = Column(INET)
    user_agent = Column(String(255))
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    revoked_at = Column(DateTime(timezone=True))
    revoked_reason = Column(String(64))


class SsoIdentity(Base):
    __tablename__ = "sso_identities"
    id = Column(UUID(as_uuid=True), primary_key=True, default=_uuid)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    provider = Column(String(32), nullable=False)
    subject = Column(String(255), nullable=False)
    email = Column(String(255))
    raw_claims = Column(JSONB, default=dict)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    __table_args__ = (UniqueConstraint("provider", "subject", name="uq_sso_provider_subject"),)


# --- KB ---

class KbDocument(Base):
    __tablename__ = "kb_documents"
    id = Column(UUID(as_uuid=True), primary_key=True, default=_uuid)
    title = Column(String, nullable=False)
    source_uri = Column(String)
    doc_type = Column(String, nullable=False)
    version = Column(String, default="1.0", nullable=False)
    owner = Column(String)
    classification = Column(String, default="internal", nullable=False)
    effective_date = Column(Date)
    status = Column(String, default="active", nullable=False, index=True)
    checksum = Column(String, index=True)
    metadata_ = Column("metadata", JSONB, default=dict)
    tenant_id = Column(UUID(as_uuid=True), index=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        Index("idx_kb_docs_title_version", "title", "version"),
    )


class KbChunk(Base):
    __tablename__ = "kb_chunks"
    id = Column(UUID(as_uuid=True), primary_key=True, default=_uuid)
    document_id = Column(UUID(as_uuid=True), ForeignKey("kb_documents.id", ondelete="CASCADE"), nullable=False)
    chunk_index = Column(Integer, nullable=False)
    content = Column(Text, nullable=False)
    # embedding es vector(1024); se maneja fuera de SQLAlchemy ORM puro por pgvector
    token_count = Column(Integer)
    section = Column(String)
    metadata_ = Column("metadata", JSONB, default=dict)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    __table_args__ = (UniqueConstraint("document_id", "chunk_index"),)


# --- Chat ---

class ChatHistory(Base):
    __tablename__ = "chat_history"
    id = Column(UUID(as_uuid=True), primary_key=True, default=_uuid)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String)
    source = Column(String, default="web", nullable=False)
    started_at = Column(DateTime(timezone=True), default=datetime.utcnow, index=True)
    ended_at = Column(DateTime(timezone=True))
    metadata_ = Column("metadata", JSONB, default=dict)
    tenant_id = Column(UUID(as_uuid=True), index=True)


class ChatMessage(Base):
    __tablename__ = "chat_messages"
    id = Column(UUID(as_uuid=True), primary_key=True, default=_uuid)
    chat_id = Column(UUID(as_uuid=True), ForeignKey("chat_history.id", ondelete="CASCADE"), nullable=False)
    role = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    citations = Column(JSONB)
    intent = Column(String)
    confidence = Column(Numeric(4, 3))
    latency_ms = Column(Integer)
    tokens_in = Column(Integer)
    tokens_out = Column(Integer)
    cached = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, index=True)


class ChatFeedback(Base):
    __tablename__ = "chat_feedback"
    id = Column(UUID(as_uuid=True), primary_key=True, default=_uuid)
    message_id = Column(UUID(as_uuid=True), ForeignKey("chat_messages.id", ondelete="CASCADE"), index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    rating = Column(Integer, nullable=False)
    comment = Column(Text)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)


# --- Tickets ---

class Ticket(Base):
    __tablename__ = "tickets"
    id = Column(UUID(as_uuid=True), primary_key=True, default=_uuid)
    ticket_number = Column(String, unique=True, nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text)
    category = Column(String)
    severity = Column(String, nullable=False)
    status = Column(String, default="nuevo", nullable=False, index=True)
    source = Column(String, default="chatbot", nullable=False)
    chat_id = Column(UUID(as_uuid=True), ForeignKey("chat_history.id"))
    reported_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    assigned_to = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    due_at = Column(DateTime(timezone=True))
    resolved_at = Column(DateTime(timezone=True))
    resolution = Column(Text)
    metadata_ = Column("metadata", JSONB, default=dict)
    tenant_id = Column(UUID(as_uuid=True), index=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, index=True)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)


class ClassifierLabel(Base):
    __tablename__ = "classifier_labels"
    id = Column(UUID(as_uuid=True), primary_key=True, default=_uuid)
    message_id = Column(UUID(as_uuid=True), ForeignKey("chat_messages.id", ondelete="CASCADE"), index=True)
    predicted_is_incident = Column(Boolean)
    predicted_category = Column(String(32))
    predicted_severity = Column(String(4))
    true_is_incident = Column(Boolean, nullable=False)
    true_category = Column(String(32))
    true_severity = Column(String(4))
    labeled_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    labeled_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    notes = Column(Text)


# --- Reportes ---

class ReportExport(Base):
    __tablename__ = "report_exports"
    id = Column(UUID(as_uuid=True), primary_key=True, default=_uuid)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), index=True)
    report_type = Column(String(64), nullable=False)
    format = Column(String(16), nullable=False)
    params = Column(JSONB, default=dict)
    file_path = Column(Text)
    size_bytes = Column(Integer)
    expires_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, index=True)


# --- Auditoría ---

class AuditLog(Base):
    __tablename__ = "audit_log"
    id = Column(BigInteger, primary_key=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    module = Column(String, nullable=False, index=True)
    action = Column(String, nullable=False, index=True)
    entity = Column(String)
    entity_id = Column(String)
    ip = Column(INET)
    user_agent = Column(String)
    input = Column(JSONB)
    output = Column(JSONB)
    result = Column(String, index=True)
    request_id = Column(String(64), index=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, index=True)


# --- Jurisdicción ---

class JurisdictionPolicy(Base):
    __tablename__ = "jurisdiction_policies"
    id = Column(String(32), primary_key=True)
    name = Column(String(128), nullable=False)
    chat_retention_days = Column(Integer, nullable=False)
    ticket_retention_days = Column(Integer, nullable=False)
    audit_retention_days = Column(Integer, nullable=False)
    pii_redaction_required = Column(Boolean, default=True)
    right_to_erasure = Column(Boolean, default=False)
    notes = Column(Text)


class Tenant(Base):
    __tablename__ = "tenants"
    id = Column(UUID(as_uuid=True), primary_key=True, default=_uuid)
    slug = Column(String(64), unique=True, nullable=False)
    name = Column(String(255), nullable=False)
    jurisdiction = Column(String(32), ForeignKey("jurisdiction_policies.id"), default="default")
    is_active = Column(Boolean, default=True)
    config = Column(JSONB, default=dict)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)