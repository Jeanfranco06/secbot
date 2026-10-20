from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0007_tenant"
down_revision = "0006_jurisdiction"

def upgrade():
    op.create_table(
        "tenants",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("slug", sa.String(64), unique=True, nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("jurisdiction", sa.String(32), sa.ForeignKey("jurisdiction_policies.id"), server_default="default"),
        sa.Column("is_active", sa.Boolean, server_default=sa.text("true")),
        sa.Column("config", postgresql.JSONB, server_default="{}"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    for tbl in ("users", "kb_documents", "chat_history", "tickets"):
        op.add_column(tbl, sa.Column("tenant_id", postgresql.UUID(as_uuid=True),
                                     sa.ForeignKey("tenants.id", ondelete="CASCADE")))
        op.create_index(f"idx_{tbl}_tenant", tbl, ["tenant_id"])

    # RLS nativo PostgreSQL
    op.execute("ALTER TABLE kb_documents ENABLE ROW LEVEL SECURITY")
    op.execute("ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY")
    op.execute("ALTER TABLE tickets ENABLE ROW LEVEL SECURITY") 