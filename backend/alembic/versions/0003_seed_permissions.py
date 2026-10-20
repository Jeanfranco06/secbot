"""Seed permisos y roles"""
from alembic import op
import sqlalchemy as sa

revision = "0003_seed_permissions"
down_revision = "0002_fase1"

PERMISSIONS = [
    ("chat.use", "Usar el chatbot"),
    ("chat.view_own", "Ver historial propio"),
    ("chat.view_all", "Ver todos los historiales"),
    ("ticket.view_own", "Ver tickets propios"),
    ("ticket.view_all", "Ver todos los tickets"),
    ("ticket.manage", "Gestionar tickets"),
    ("dashboard.view", "Ver dashboard"),
    ("report.export", "Exportar reportes"),
    ("kb.manage", "Gestionar KB"),
    ("users.manage", "Gestionar usuarios"),
    ("audit.view", "Ver auditoría"),
    ("settings.manage", "Configuración del sistema"),
]

ROLE_PERMS = {
    "admin": [p[0] for p in PERMISSIONS],
    "security_analyst": [
        "chat.use", "chat.view_own", "chat.view_all",
        "ticket.view_all", "ticket.manage",
        "dashboard.view", "report.export", "kb.manage", "audit.view",
    ],
    "employee": ["chat.use", "chat.view_own", "ticket.view_own"],
}

def upgrade():
    conn = op.get_bind()
    for code, desc in PERMISSIONS:
        conn.execute(sa.text(
            "INSERT INTO permissions (code, description) VALUES (:c, :d) "
            "ON CONFLICT (code) DO NOTHING"
        ), {"c": code, "d": desc})

    for role_name, perms in ROLE_PERMS.items():
        role_id = conn.execute(sa.text("SELECT id FROM roles WHERE name=:n"), {"n": role_name}).scalar()
        if not role_id:
            continue
        for code in perms:
            pid = conn.execute(sa.text("SELECT id FROM permissions WHERE code=:c"), {"c": code}).scalar()
            if pid:
                conn.execute(sa.text(
                    "INSERT INTO role_permissions (role_id, permission_id) VALUES (:r, :p) "
                    "ON CONFLICT DO NOTHING"
                ), {"r": role_id, "p": pid})

def downgrade():
    op.execute("DELETE FROM role_permissions")
    op.execute("DELETE FROM permissions")