def test_permissions_cache(client, db):
    from app.auth import get_user_permissions
    from app import models
    from app.auth import hash_password

    u = models.User(email="p@x.c", full_name="P", password_hash=hash_password("x"))
    db.add(u); db.commit(); db.refresh(u)
    role = db.query(models.Role).filter(models.Role.name == "security_analyst").first()
    db.add(models.UserRole(user_id=u.id, role_id=role.id)); db.commit()

    perms = get_user_permissions(db, u.id)
    assert "chat.use" in perms
    assert "ticket.manage" in perms
    assert "users.manage" not in perms