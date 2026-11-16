"""Sync missing columns in chat_messages and report_exports"""
from alembic import op
import sqlalchemy as sa

revision = "0010_sync_missing_columns"
down_revision = "0009_audit_log_request_id"
branch_labels = None
depends_on = None


def upgrade():
    op.execute("""
        ALTER TABLE chat_messages
          ADD COLUMN IF NOT EXISTS tokens_in INTEGER,
          ADD COLUMN IF NOT EXISTS tokens_out INTEGER,
          ADD COLUMN IF NOT EXISTS cached BOOLEAN DEFAULT FALSE;
    """)
    op.execute("""
        ALTER TABLE report_exports
          ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
    """)


def downgrade():
    op.execute("""
        ALTER TABLE report_exports DROP COLUMN IF EXISTS expires_at;
        ALTER TABLE chat_messages
          DROP COLUMN IF EXISTS cached,
          DROP COLUMN IF EXISTS tokens_out,
          DROP COLUMN IF EXISTS tokens_in;
    """)
