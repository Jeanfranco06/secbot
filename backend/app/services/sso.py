"""Stub de SSO OIDC para integración futura con Azure AD / Google Workspace / Keycloak.
No se activa en Fase 2; queda listo para Fase 3.
"""
import os
from authlib.integrations.starlette_client import OAuth
from fastapi import APIRouter, Request, HTTPException
from starlette.responses import RedirectResponse

SSO_ENABLED = os.getenv("SSO_ENABLED", "false").lower() == "true"
SSO_PROVIDER = os.getenv("SSO_PROVIDER", "azure")

oauth = OAuth()
if SSO_ENABLED:
    if SSO_PROVIDER == "azure":
        oauth.register(
            name="azure",
            client_id=os.getenv("AZURE_CLIENT_ID"),
            client_secret=os.getenv("AZURE_CLIENT_SECRET"),
            server_metadata_url=f"https://login.microsoftonline.com/{os.getenv('AZURE_TENANT_ID')}/v2.0/.well-known/openid-configuration",
            client_kwargs={"scope": "openid email profile"},
        )

router = APIRouter(prefix="/api/v1/sso", tags=["sso"])

@router.get("/login")
async def sso_login(request: Request):
    if not SSO_ENABLED:
        raise HTTPException(status_code=404, detail="SSO no habilitado")
    redirect_uri = os.getenv("SSO_REDIRECT_URI")
    return await oauth.azure.authorize_redirect(request, redirect_uri)

@router.get("/callback")
async def sso_callback(request: Request):
    if not SSO_ENABLED:
        raise HTTPException(status_code=404, detail="SSO no habilitado")
    token = await oauth.azure.authorize_access_token(request)
    userinfo = token.get("userinfo")
    # TODO: mapear userinfo a User local, emitir JWT propio
    return RedirectResponse("/chat")