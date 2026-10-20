from app import models
from app.auth import hash_password

def _create_user(db, email="a@b.c", pwd="secret123", role="employee"):
    u = models.User(email=email, full_name="Test", password_hash=hash_password(pwd))
    db.add(u); db.commit(); db.refresh(u)
    r = db.query(models.Role).filter(models.Role.name == role).first()
    db.add(models.UserRole(user_id=u.id, role_id=r.id)); db.commit()
    return u

def test_login_ok(client, db):
    _create_user(db)
    r = client.post("/api/v1/auth/login", json={"email": "a@b.c", "password": "secret123"})
    assert r.status_code == 200
    assert "access_token" in r.json()

def test_login_fail(client, db):
    _create_user(db)
    r = client.post("/api/v1/auth/login", json={"email": "a@b.c", "password": "bad"})
    assert r.status_code == 401

def test_rbac_employee_cannot_list_tickets(client, db):
    _create_user(db)
    r = client.post("/api/v1/auth/login", json={"email": "a@b.c", "password": "secret123"})
    token = r.json()["access_token"]
    r = client.get("/api/v1/tickets", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 403