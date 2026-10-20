"""Fase 1: RBAC extendido, RBAC permissions, audit export, retention"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0002_fase1"
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    # Permisos finos
    op.create_table(
        "permissions",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("code", sa.String(64), unique=True, nullable=False),
        sa.Column("description", sa.String(255)),
    )
    op.create_table(
        "role_permissions",
        sa.Column("role_id", sa.Integer, sa.ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("permission_id", sa.Integer, sa.ForeignKey("permissions.id", ondelete="CASCADE"), primary_key=True),
    )

    # Sesiones activas para poder invalidar tokens
    op.create_table(
        "sessions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE")),
        sa.Column("refresh_jti", sa.String(64), unique=True, nullable=False),
        sa.Column("ip", postgresql.INET),
        sa.Column("user_agent", sa.String(255)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("revoked_at", sa.DateTime(timezone=True)),
    )

    # Feedback de respuestas (para mejorar KB)
    op.create_table(
        "chat_feedback",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("message_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("chat_messages.id", ondelete="CASCADE")),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id")),
        sa.Column("rating", sa.Integer, nullable=False),  # 1-5
        sa.Column("comment", sa.Text),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # Reportes generados
    op.create_table(
        "report_exports",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id")),
        sa.Column("report_type", sa.String(64), nullable=False),
        sa.Column("format", sa.String(16), nullable=False),
        sa.Column("params", postgresql.JSONB, server_default="{}"),
        sa.Column("file_path", sa.Text),
        sa.Column("size_bytes", sa.Integer),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # Índices extra
    op.create_index("idx_sessions_user", "sessions", ["user_id"])
    op.create_index("idx_feedback_message", "chat_feedback", ["message_id"])
    op.create_index("idx_reports_user", "report_exports", ["user_id", "created_at"])

def downgrade():
    op.drop_table("report_exports")
    op.drop_table("chat_feedback")
    op.drop_table("sessions")
    op.drop_table("role_permissions")
    op.drop_table("permissions")