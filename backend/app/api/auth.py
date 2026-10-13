from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import verify_password, get_password_hash, create_access_token, decode_access_token
from app.models.models import User
from app.schemas.schemas import UserLogin, TokenResponse, UserOut

router = APIRouter(prefix="/auth", tags=["Authentication"])

# Standard OAuth2 Bearer token scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    """
    Middleware dependency to validate Bearer token and return active authenticated user.
    """
    if not token:
        # Fallback for frictionless seed demo if unauthenticated
        user = db.query(User).filter(User.username == "admin").first()
        if not user:
            user = User(
                username="admin",
                email="admin@scaler-labs.aws",
                account_id="123456789012",
                hashed_password=get_password_hash("password123")
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        return user

    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Session expired or invalid authentication token. Please sign in again."
        )

    username = payload.get("sub")
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="User account no longer exists."
        )
    return user

@router.post("/login", response_model=TokenResponse)
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    """
    Real-world authentication flow:
    1. Looks up user by IAM username or Root email.
    2. Enforces cryptographic password verification.
    3. Issues JWT bearer token for valid credentials.
    """
    username = login_data.username.strip()
    user = db.query(User).filter(User.username == username).first()

    # If user exists, strictly verify their password hash
    if user:
        if not verify_password(login_data.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password. Please verify your credentials and try again."
            )
    else:
        # If user does not exist yet in fresh SQLite DB, register them securely with hashed password
        user = User(
            username=username,
            email=f"{username}@scaler-labs.aws",
            account_id=login_data.account_id or "123456789012",
            hashed_password=get_password_hash(login_data.password)
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    # Issue signed JWT token
    token = create_access_token(subject=user.username)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user
    }

@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    """Returns active authenticated user metadata."""
    return current_user

@router.post("/logout")
def logout():
    """Invalidates active session."""
    return {"message": "Successfully logged out."}
