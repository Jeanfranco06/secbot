from app.auth import get_user_permissions, hash_password
from app import models

def test_permissions_cache(client, db):
    u = db.query(models.User).filter(models.User.email == "p_rbac@x.c").first()
    if not u:
        u = models.User(email="p_rbac@x.c", full_name="P", password_hash=hash_password("valid_test_password_123"), is_active=True)
        db.add(u)
        db.commit()
        db.refresh(u)
    else:
        u.password_hash = hash_password("valid_test_password_123")
        u.is_active = True
        db.commit()
    
    role = db.query(models.Role).filter(models.Role.name == "security_analyst").first()
    if not role:
        role = models.Role(name="security_analyst", description="Security Analyst")
        db.add(role)
        db.commit()
        db.refresh(role)
        
    chat_perm = db.query(models.Permission).filter(models.Permission.code == "chat.use").first()
    if not chat_perm:
        chat_perm = models.Permission(code="chat.use", description="Chat access")
        db.add(chat_perm)
        db.commit()
    ticket_perm = db.query(models.Permission).filter(models.Permission.code == "ticket.manage").first()
    if not ticket_perm:
        ticket_perm = models.Permission(code="ticket.manage", description="Ticket manage")
        db.add(ticket_perm)
        db.commit()
        
    for p in [chat_perm, ticket_perm]:
        exists = db.query(models.RolePermission).filter_by(role_id=role.id, permission_id=p.id).first()
        if not exists:
            db.add(models.RolePermission(role_id=role.id, permission_id=p.id))
    db.commit()

    db.query(models.UserRole).filter_by(user_id=u.id, role_id=role.id).delete()
    db.add(models.UserRole(user_id=u.id, role_id=role.id))
    db.commit()

    perms = get_user_permissions(db, u.id)
    assert "chat.use" in perms
    assert "ticket.manage" in perms
    assert "users.manage" not in perms
