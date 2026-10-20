import sys
import os
from app.database import SessionLocal
from app import models
from app.auth import hash_password

def main():
    if len(sys.argv) >= 4:
        email = sys.argv[1].strip()
        name = sys.argv[2].strip()
        pwd = sys.argv[3].strip()
    elif os.getenv("ADMIN_EMAIL") and os.getenv("ADMIN_PASSWORD"):
        email = os.getenv("ADMIN_EMAIL").strip()
        name = os.getenv("ADMIN_NAME", "Administrador").strip()
        pwd = os.getenv("ADMIN_PASSWORD").strip()
    else:
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