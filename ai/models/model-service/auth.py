import os
import jwt
from fastapi import Header, HTTPException


def require_auth(authorization: str = Header(default=None)) -> dict:
    """
    Same pattern as the JwtAuthGuard used in every NestJS service - verifies
    the token's signature/expiry locally using the shared JWT_SECRET, no
    network call to authentication-service needed. FastAPI dependency
    version of the same idea.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")

    token = authorization.removeprefix("Bearer ").strip()
    secret = os.environ.get("JWT_SECRET", "dev_only_insecure_secret")

    try:
        return jwt.decode(token, secret, algorithms=["HS256"])
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
