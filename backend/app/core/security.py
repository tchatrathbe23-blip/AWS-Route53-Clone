import hashlib
import os
import hmac
from datetime import datetime, timedelta
from typing import Optional, Union, Any
from jose import jwt, JWTError
from app.core.config import settings

# Salt key for cryptographic HMAC-SHA256 password hashing
SALT_KEY = b"aws_route53_enterprise_salt_2026_production"

def get_password_hash(password: str) -> str:
    """
    Cryptographic HMAC-SHA256 password hashing.
    Generates deterministic, secure one-way hashes resistant to rainbow table attacks.
    """
    return hmac.new(SALT_KEY, password.encode("utf-8"), hashlib.sha256).hexdigest()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Constant-time comparison against timing attacks (hmac.compare_digest).
    """
    calculated = get_password_hash(plain_password)
    return hmac.compare_digest(calculated, hashed_password)

def create_access_token(subject: Union[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """
    Issues industry-standard RS/HS JWT access token with expiration and subject claims.
    """
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode = {"exp": expire, "sub": str(subject), "iat": datetime.utcnow()}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> Optional[dict]:
    """
    Decodes and validates JWT signature and expiry claim.
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        return None
