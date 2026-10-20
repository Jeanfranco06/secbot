"""Crea usuario de carga para Locust.
Uso: docker compose exec backend python -m ops.seed_loadtest
"""
from app.database import SessionLocal
from app import models
from app.auth import hash_password

EMAIL = "loadtest@empresa.local"
PWD = "loadtest123"

def main():
    with SessionLocal() as db:
        if db.query(models.User).filter(models.User.email == EMAIL).first():
            print("Ya existe")
            return
        u = models.User(email=EMAIL, full_name="Load Test", password_hash=hash_password(PWD))
        db.add(u); db.commit(); db.refresh(u)
        role = db.query(models.Role).filter(models.Role.name == "employee").first()
        db.add(models.UserRole(user_id=u.id, role_id=role.id))
        db.commit()
        print(f"Creado {EMAIL} / {PWD}")

if __name__ == "__main__":
    main()