import uuid
from app import models
from app.auth import hash_password

def _admin_token(client, db):
    role = db.query(models.Role).filter(models.Role.name == "admin").first()
    if not role:
        role = models.Role(name="admin", description="Admin role")
        db.add(role)
        db.commit()
        db.refresh(role)

    perm = db.query(models.Permission).filter(models.Permission.code == "kb.manage").first()
    if not perm:
        perm = models.Permission(code="kb.manage", description="Manage KB")
        db.add(perm)
        db.commit()
        db.refresh(perm)

    rp = db.query(models.RolePermission).filter_by(role_id=role.id, permission_id=perm.id).first()
    if not rp:
        db.add(models.RolePermission(role_id=role.id, permission_id=perm.id))
        db.commit()

    u = db.query(models.User).filter(models.User.email == "kb_admin@empresa.local").first()
    if not u:
        u = models.User(email="kb_admin@empresa.local", full_name="KB Admin", password_hash=hash_password("admin_pass_123"), is_active=True)
        db.add(u)
        db.commit()
        db.refresh(u)
    else:
        u.password_hash = hash_password("admin_pass_123")
        u.is_active = True
        db.commit()

    db.query(models.UserRole).filter_by(user_id=u.id).delete()
    db.add(models.UserRole(user_id=u.id, role_id=role.id))
    db.commit()

    res = client.post("/api/v1/auth/login", json={"email": "kb_admin@empresa.local", "password": "admin_pass_123"})
    return res.json()["access_token"]


def test_kb_list_and_stats(client, db):
    token = _admin_token(client, db)
    headers = {"Authorization": f"Bearer {token}"}

    res_docs = client.get("/api/v1/kb/documents", headers=headers)
    assert res_docs.status_code == 200
    docs = res_docs.json()
    assert isinstance(docs, list)

    res_stats = client.get("/api/v1/kb/stats", headers=headers)
    assert res_stats.status_code == 200
    stats = res_stats.json()
    assert "documents" in stats
    assert "chunks" in stats


def test_kb_detail_and_download(client, db):
    token = _admin_token(client, db)
    headers = {"Authorization": f"Bearer {token}"}

    # Ensure at least one test document exists
    doc = db.query(models.KbDocument).first()
    if not doc:
        doc = models.KbDocument(
            title="Test Security Policy",
            doc_type="policy",
            version="1.0",
            status="active"
        )
        db.add(doc)
        db.commit()
        db.refresh(doc)

        chunk = models.KbChunk(
            document_id=doc.id,
            chunk_index=0,
            content="Este es un documento de prueba de política de seguridad.",
            token_count=10,
            section="Introducción"
        )
        db.add(chunk)
        db.commit()

    # Detail preview test
    res_detail = client.get(f"/api/v1/kb/documents/{doc.id}", headers=headers)
    assert res_detail.status_code == 200
    data = res_detail.json()
    assert data["id"] == str(doc.id)
    assert data["title"] == doc.title
    assert "content" in data
    assert "chunks" in data
    assert data["total_chunks"] >= 0

    # Download test
    res_dl = client.get(f"/api/v1/kb/documents/{doc.id}/download", headers=headers)
    assert res_dl.status_code == 200
    assert "attachment" in res_dl.headers.get("content-disposition", "")
    assert len(res_dl.content) > 0


def test_kb_detail_not_found(client, db):
    token = _admin_token(client, db)
    headers = {"Authorization": f"Bearer {token}"}
    fake_id = uuid.uuid4()
    res = client.get(f"/api/v1/kb/documents/{fake_id}", headers=headers)
    assert res.status_code == 404
