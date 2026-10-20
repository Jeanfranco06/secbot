"""Add request_id to audit_log

Revision ID: 0009_audit_log_request_id
Revises: 0008_sessions_revoked_reason
Create Date: 2026-10-20
"""
from alembic import op
import sqlalchemy as sa

revision = "0009_audit_log_request_id"
down_revision = "0008_sessions_revoked_reason"
branch_labels = None
depends_on = None

def upgrade():
    op.add_column("audit_log", sa.Column("request_id", sa.String(64), nullable=True))
    op.create_index("idx_audit_log_request_id", "audit_log", ["request_id"])

def downgrade():
    op.drop_index("idx_audit_log_request_id", table_name="audit_log")
    op.drop_column("audit_log", "request_id")
