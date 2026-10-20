"""Add revoked_reason to sessions

Revision ID: 0008_sessions_revoked_reason
Revises: 0007_tenant
Create Date: 2026-10-20
"""
from alembic import op
import sqlalchemy as sa

revision = "0008_sessions_revoked_reason"
down_revision = "0007_tenant"
branch_labels = None
depends_on = None

def upgrade():
    op.add_column("sessions", sa.Column("revoked_reason", sa.String(64), nullable=True))

def downgrade():
    op.drop_column("sessions", "revoked_reason")
