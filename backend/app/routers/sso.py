from fastapi import APIRouter, Request, HTTPException, Depends
from starlette.responses import RedirectResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.services import sso
from app.auth import create_access_token, create_refresh_token, get_user_roles
from app import models
from app.services.audit import log_action

router = APIRouter(prefix="/api/v1/sso", tags=["sso"])

@router.get("/providers")
def list_providers():
    return {name: sso.provider_enabled(name) for name in sso.PROVIDERS}

@router.get("/{provider}/login")
async def sso_login(provider: str, request: Request):
    if not sso.provider_enabled(provider):
        raise HTTPException(status_code=404, detail=f"Proveedor {provider} no configurado")
    sso.init_oauth()
    redirect_uri = f"{request.base_url}api/v1/sso/{provider}/callback"
    return await getattr(sso.oauth, provider).authorize_redirect(request, redirect_uri)

@router.get("/{provider}/callback")
async def sso_callback(provider: str, request: Request, db: Session = Depends(get_db)):
    if not sso.provider_enabled(provider):
        raise HTTPException(status_code=404, detail="Proveedor no configurado")
    sso.init_oauth()
    try:
        token = await getattr(sso.oauth, provider).authorize_access_token(request)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"SSO falló: {e}")

    userinfo = token.get("userinfo")
    if not userinfo:
        raise HTTPException(status_code=400, detail="Sin userinfo")

    user = sso.upsert_identity(db, provider, userinfo)
    roles = get_user_roles(db, user.id)
    access = create_access_token(user, roles)
    refresh = create_refresh_token(user, roles)

    # Registrar sesión
    from app.auth import decode_token
    ref_payload = decode_token(refresh)
    db.add(models.Session(
        user_id=user.id, refresh_jti=ref_payload["jti"],
        ip=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent", "")[:255],
    ))
    db.commit()

    log_action(db, user_id=user.id, module="auth", action="sso_login",
               input_data={"provider": provider})

    # Redirigir al frontend con tokens en fragmento (más seguro que query)
    front = request.headers.get("referer", "/")
    redirect = f"{front.split('/chat')[0]}/#access={access}&refresh={refresh}"
    return RedirectResponse(redirect)