from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0004_sso"
down_revision = "0003_seed_permissions"

def upgrade():
    op.create_table(
        "sso_identities",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE")),
        sa.Column("provider", sa.String(32), nullable=False),  # azure, google, keycloak
        sa.Column("subject", sa.String(255), nullable=False),  # sub del IdP
        sa.Column("email", sa.String(255)),
        sa.Column("raw_claims", postgresql.JSONB, server_default="{}"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.UniqueConstraint("provider", "subject", name="uq_sso_provider_subject"),
    )
    op.create_index("idx_sso_user", "sso_identities", ["user_id"])

    # Renombrar password_hash a nullable (usuarios SSO no tienen password local)
    op.alter_column("users", "password_hash", nullable=True)