"""Schemas Pydantic v2 consolidados."""
from datetime import datetime
from typing import Optional, List, Any
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field, ConfigDict


# --- Auth ---

class LoginIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class TokenOut(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int = 3600


class MeOut(BaseModel):
    id: UUID
    email: EmailStr
    full_name: str
    roles: List[str]
    permissions: List[str]


# --- Users ---

class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    email: EmailStr
    full_name: str
    is_active: bool
    roles: List[str] = []


class UserCreate(BaseModel):
    email: EmailStr
    full_name: str = Field(min_length=2, max_length=200)
    password: str = Field(min_length=10, max_length=128)
    roles: List[str] = ["employee"]


class UserUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=200)
    is_active: Optional[bool] = None
    password: Optional[str] = Field(None, min_length=10, max_length=128)
    roles: Optional[List[str]] = None


class PasswordReset(BaseModel):
    new_password: str = Field(min_length=10, max_length=128)


class RolePermissionsIn(BaseModel):
    permissions: List[str]


# --- Chat ---

class ChatIn(BaseModel):
    message: str = Field(min_length=1, max_length=4000)
    chat_id: Optional[UUID] = None


class Citation(BaseModel):
    index: int
    document_id: str
    title: str
    version: str
    section: Optional[str] = None
    source_uri: Optional[str] = None


class ChatOut(BaseModel):
    chat_id: UUID
    message_id: UUID
    answer: str
    citations: List[Citation]
    intent: Optional[str] = None
    confidence: Optional[float] = None
    latency_ms: int
    cached: bool = False
    ticket_id: Optional[UUID] = None


class FeedbackIn(BaseModel):
    message_id: UUID
    rating: int = Field(ge=1, le=5)
    comment: Optional[str] = Field(None, max_length=1000)


# --- Tickets ---

class TicketOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    ticket_number: str
    title: str
    severity: str
    status: str
    category: Optional[str] = None
    assigned_to: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime
    due_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None


class TicketDetail(TicketOut):
    description: Optional[str] = None
    resolution: Optional[str] = None
    reported_by: Optional[UUID] = None
    chat_id: Optional[UUID] = None
    metadata: dict = {}


class TicketUpdate(BaseModel):
    status: Optional[str] = None
    assigned_to: Optional[UUID] = None
    resolution: Optional[str] = Field(None, max_length=5000)


class LabelIn(BaseModel):
    true_is_incident: bool
    true_category: Optional[str] = None
    true_severity: Optional[str] = Field(None, pattern="^P[1-4]$")
    notes: Optional[str] = Field(None, max_length=2000)


# --- KB ---

class KbDocumentOut(BaseModel):
    id: UUID
    title: str
    doc_type: str
    version: str
    status: str
    owner: Optional[str]
    effective_date: Optional[datetime] = None
    updated_at: datetime


class KbUploadResponse(BaseModel):
    doc_id: str
    title: str
    version: str
    chunks: int
    source: str


# --- Dashboard ---

class DashboardSummary(BaseModel):
    total_queries: int
    resolved_without_escalation: int
    incidents_reported: int
    escalation_rate: float
    avg_latency_ms: float
    p95_latency_ms: float
    citation_coverage: float
    hours_saved: float
    top_topics: List[dict]
    tickets_by_status: dict
    tickets_by_severity: dict
    queries_by_day: List[dict]


# --- Sesiones ---

class SessionOut(BaseModel):
    id: UUID
    ip: Optional[str]
    user_agent: Optional[str]
    created_at: datetime
    revoked_at: Optional[datetime] = None
    current: bool = False