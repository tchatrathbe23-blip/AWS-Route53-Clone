from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import verify_password, get_password_hash, create_access_token, decode_access_token
from app.models.models import User
from app.schemas.schemas import UserLogin, TokenResponse, UserOut

router = APIRouter(prefix="/auth", tags=["Authentication"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    if not token:
        # Default mock user if not authenticated for seamless demo, but valid session works
        user = db.query(User).filter(User.username == "aws-admin").first()
        if not user:
            user = User(
                username="aws-admin",
                email="admin@aws-demo.internal",
                account_id="123456789012",
                hashed_password=get_password_hash("Admin123!")
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        return user

    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    username = payload.get("sub")
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user

@router.post("/login", response_model=TokenResponse)
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == login_data.username).first()
    if not user:
        # Auto-create user for frictionless mock auth
        user = User(
            username=login_data.username,
            email=f"{login_data.username}@aws-demo.internal",
            account_id=login_data.account_id or "123456789012",
            hashed_password=get_password_hash(login_data.password)
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        # For mock demo: accept password or verify
        pass

    token = create_access_token(subject=user.username)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user
    }

@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.post("/logout")
def logout():
    return {"message": "Successfully logged out"}
