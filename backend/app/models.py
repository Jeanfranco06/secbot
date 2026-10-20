import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Boolean, DateTime, Integer, ForeignKey, Text,
    Numeric, BigInteger, Date
)
from sqlalchemy.dialects.postgresql import UUID, JSONB, INET
from sqlalchemy.orm import relationship
from app.database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, nullable=False, index=True)
    full_name = Column(String, nullable=False)
    password_hash = Column(String, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    last_login_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow)

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

class KbDocument(Base):
    __tablename__ = "kb_documents"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String, nullable=False)
    source_uri = Column(String)
    doc_type = Column(String, nullable=False)
    version = Column(String, default="1.0", nullable=False)
    owner = Column(String)
    classification = Column(String, default="internal", nullable=False)
    effective_date = Column(Date)
    status = Column(String, default="active", nullable=False)
    checksum = Column(String)
    metadata_ = Column("metadata", JSONB, default=dict)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow)

class ChatHistory(Base):
    __tablename__ = "chat_history"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    title = Column(String)
    source = Column(String, default="web", nullable=False)
    started_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    ended_at = Column(DateTime(timezone=True))
    metadata_ = Column("metadata", JSONB, default=dict)

class ChatMessage(Base):
    __tablename__ = "chat_messages"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    chat_id = Column(UUID(as_uuid=True), ForeignKey("chat_history.id", ondelete="CASCADE"), nullable=False)
    role = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    citations = Column(JSONB)
    intent = Column(String)
    confidence = Column(Numeric(4, 3))
    latency_ms = Column(Integer)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

class Ticket(Base):
    __tablename__ = "tickets"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ticket_number = Column(String, unique=True, nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text)
    category = Column(String)
    severity = Column(String, nullable=False)
    status = Column(String, default="nuevo", nullable=False)
    source = Column(String, default="chatbot", nullable=False)
    chat_id = Column(UUID(as_uuid=True), ForeignKey("chat_history.id"))
    reported_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    assigned_to = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    due_at = Column(DateTime(timezone=True))
    resolved_at = Column(DateTime(timezone=True))
    resolution = Column(Text)
    metadata_ = Column("metadata", JSONB, default=dict)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow)

class AuditLog(Base):
    __tablename__ = "audit_log"
    id = Column(BigInteger, primary_key=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    module = Column(String, nullable=False)
    action = Column(String, nullable=False)
    entity = Column(String)
    entity_id = Column(String)
    ip = Column(INET)
    user_agent = Column(String)
    input = Column(JSONB)
    output = Column(JSONB)
    result = Column(String)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

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
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))
    refresh_jti = Column(String(64), unique=True, nullable=False)
    ip = Column(INET)
    user_agent = Column(String(255))
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    revoked_at = Column(DateTime(timezone=True))

class ChatFeedback(Base):
    __tablename__ = "chat_feedback"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    message_id = Column(UUID(as_uuid=True), ForeignKey("chat_messages.id", ondelete="CASCADE"))
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    rating = Column(Integer, nullable=False)
    comment = Column(Text)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

class ReportExport(Base):
    __tablename__ = "report_exports"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    report_type = Column(String(64), nullable=False)
    format = Column(String(16), nullable=False)
    params = Column(JSONB, default=dict)
    file_path = Column(Text)
    size_bytes = Column(Integer)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)