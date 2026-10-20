from alembic import op
import sqlalchemy as sa

revision = "0006_jurisdiction"
down_revision = "0005_classifier_labels"

def upgrade():
    op.create_table(
        "jurisdiction_policies",
        sa.Column("id", sa.String(32), primary_key=True),  # gdpr, pe_ley_1581, br_lgpd, default
        sa.Column("name", sa.String(128), nullable=False),
        sa.Column("chat_retention_days", sa.Integer, nullable=False),
        sa.Column("ticket_retention_days", sa.Integer, nullable=False),
        sa.Column("audit_retention_days", sa.Integer, nullable=False),
        sa.Column("pii_redaction_required", sa.Boolean, default=True),
        sa.Column("right_to_erasure", sa.Boolean, default=False),
        sa.Column("notes", sa.Text),
    )
    op.execute("""
        INSERT INTO jurisdiction_policies VALUES
          ('default',       'Base PYME',           365, 730, 1825, TRUE,  FALSE, 'Base razonable'),
          ('gdpr',          'UE GDPR',             180, 365, 1825, TRUE,  TRUE,  'Derecho al olvido'),
          ('pe_ley_1581',   'Perú Ley 1581',       365, 730, 1825, TRUE,  TRUE,  'Derechos ARCO'),
          ('br_lgpd',       'Brasil LGPD',         180, 365, 1825, TRUE,  TRUE,  'Derecho eliminación')
    """)

    op.add_column("users", sa.Column("jurisdiction", sa.String(32), server_default="default"))