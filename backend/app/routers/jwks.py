from fastapi import APIRouter
from jose import jwk
from pathlib import Path
from app.config import settings

router = APIRouter()

@router.get("/.well-known/jwks.json")
def jwks():
    pub = Path(settings.jwt_public_key_path).read_text()
    key = jwk.construct(pub, algorithm=settings.jwt_algorithm)
    data = key.to_dict()
    data["kid"] = settings.jwt_kid
    data["use"] = "sig"
    data["alg"] = settings.jwt_algorithm
    return {"keys": [data]}