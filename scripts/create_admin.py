"""Crea el primer usuario admin.
Uso: docker compose exec backend python -m scripts.create_admin
"""
from app.database import SessionLocal
from app import models
from app.auth import hash_password

def main():
    email = input("Email admin: ").strip()
    name = input("Nombre completo: ").strip()
    pwd = input("Password: ").strip()

    with SessionLocal() as db:
        if db.query(models.User).filter(models.User.email == email).first():
            print("Usuario ya existe")
            return
        u = models.User(email=email, full_name=name, password_hash=hash_password(pwd))
        db.add(u)
        db.commit()
        db.refresh(u)
        role = db.query(models.Role).filter(models.Role.name == "admin").first()
        db.add(models.UserRole(user_id=u.id, role_id=role.id))
        db.commit()
        print(f"Admin creado: {u.email}")

if __name__ == "__main__":
    main()