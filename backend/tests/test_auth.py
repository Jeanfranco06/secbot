from app import models
from app.auth import hash_password

def _create_user(db, email="a@b.c", pwd="secret12345", role="employee"):
    r = db.query(models.Role).filter(models.Role.name == role).first()
    if not r:
        r = models.Role(name=role, description="Test role")
        db.add(r)
        db.commit()
        db.refresh(r)
    u = db.query(models.User).filter(models.User.email == email).first()
    if not u:
        u = models.User(email=email, full_name="Test", password_hash=hash_password(pwd), is_active=True)
        db.add(u)
        db.commit()
        db.refresh(u)
    else:
        u.password_hash = hash_password(pwd)
        u.is_active = True
        db.commit()
    db.query(models.UserRole).filter(models.UserRole.user_id == u.id).delete()
    db.add(models.UserRole(user_id=u.id, role_id=r.id))
    db.commit()
    return u

def test_login_ok(client, db):
    _create_user(db, email="test_ok@b.c")
    r = client.post("/api/v1/auth/login", json={"email": "test_ok@b.c", "password": "secret12345"})
    assert r.status_code == 200
    assert "access_token" in r.json()

def test_login_fail(client, db):
    _create_user(db, email="test_fail@b.c")
    r = client.post("/api/v1/auth/login", json={"email": "test_fail@b.c", "password": "wrong_password_123"})
    assert r.status_code == 401

def test_rbac_employee_cannot_list_tickets(client, db):
    _create_user(db, email="test_emp@b.c", role="employee")
    r = client.post("/api/v1/auth/login", json={"email": "test_emp@b.c", "password": "secret12345"})
    assert r.status_code == 200
    token = r.json()["access_token"]
    r = client.get("/api/v1/tickets", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 403
