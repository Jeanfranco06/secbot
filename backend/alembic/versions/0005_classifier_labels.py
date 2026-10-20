from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0005_classifier_labels"
down_revision = "0004_sso"

def upgrade():
    op.create_table(
        "classifier_labels",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("message_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("chat_messages.id", ondelete="CASCADE")),
        sa.Column("predicted_is_incident", sa.Boolean),
        sa.Column("predicted_category", sa.String(32)),
        sa.Column("predicted_severity", sa.String(4)),
        sa.Column("true_is_incident", sa.Boolean, nullable=False),
        sa.Column("true_category", sa.String(32)),
        sa.Column("true_severity", sa.String(4)),
        sa.Column("labeled_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id")),
        sa.Column("labeled_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("notes", sa.Text),
    )
    op.create_index("idx_labels_message", "classifier_labels", ["message_id"])