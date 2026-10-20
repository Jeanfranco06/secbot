from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr
from uuid import UUID

class LoginIn(BaseModel):
    email: EmailStr
    password: str

class TokenOut(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class UserOut(BaseModel):
    id: UUID
    email: EmailStr
    full_name: str
    is_active: bool
    roles: List[str] = []

    class Config:
        from_attributes = True

class UserCreate(BaseModel):
    email: EmailStr
    full_name: str
    password: str
    roles: List[str] = ["employee"]

class ChatIn(BaseModel):
    message: str
    chat_id: Optional[UUID] = None

class Citation(BaseModel):
    index: int
    document_id: str
    title: str
    version: str
    section: Optional[str]
    source_uri: Optional[str]

class ChatOut(BaseModel):
    chat_id: UUID
    message_id: UUID
    answer: str
    citations: List[Citation]
    intent: Optional[str]
    confidence: Optional[float]
    latency_ms: int
    ticket_id: Optional[UUID] = None

class TicketOut(BaseModel):
    id: UUID
    ticket_number: str
    title: str
    severity: str
    status: str
    category: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

class TicketUpdate(BaseModel):
    status: Optional[str] = None
    assigned_to: Optional[UUID] = None
    resolution: Optional[str] = None

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None
    roles: Optional[List[str]] = None

class PasswordReset(BaseModel):
    new_password: str

class RolePermissionsIn(BaseModel):
    permissions: List[str]

class FeedbackIn(BaseModel):
    message_id: UUID
    rating: int
    comment: Optional[str] = None

class DashboardSummary(BaseModel):
    total_queries: int
    resolved_without_escalation: int
    incidents_reported: int
    escalation_rate: float
    avg_latency_ms: float
    p95_latency_ms: float
    citation_coverage: float
    hours_saved: float
    top_topics: list[dict]
    tickets_by_status: dict
    tickets_by_severity: dict
    queries_by_day: list[dict]