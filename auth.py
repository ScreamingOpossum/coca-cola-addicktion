from fastapi import HTTPException, Depends, APIRouter, Body
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from database import SessionLocal
from models import User
from dotenv import load_dotenv
import os

# Import helper functions
from auth_helpers import create_access_token, create_refresh_token, decode_token

# Load environment variables
load_dotenv()

# Secret Key and Config
SECRET_KEY = os.getenv("SECRET_KEY", "your_secret_key")  # Default provided if not set
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 60))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", 7))

if not SECRET_KEY:
    raise RuntimeError("SECRET_KEY is not defined in the environment variables")

# Password Hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

# Dependency for Database Session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# API Router for Authentication
auth_router = APIRouter()

# Login Endpoint
@auth_router.post("/auth/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """
    Handles user login by generating access and refresh tokens.
    Email is case-insensitive during the login process.
    """
    normalized_email = form_data.username.strip().lower()  # Normalize email
    user = db.query(User).filter(func.lower(User.email) == normalized_email).first()
    if not user or not verify_password(form_data.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    tokens = create_tokens(data={"sub": str(user.id)})
    return {
        "access_token": tokens["access_token"],
        "refresh_token": tokens["refresh_token"],
        "token_type": "bearer"
    }

# Refresh Token Endpoint
@auth_router.post("/auth/refresh")
def refresh_token(refresh_token: str = Body(...), db: Session = Depends(get_db)):
    """
    Refresh the access token using a valid refresh token.
    """
    try:
        payload = decode_token(refresh_token)  # Use helper function
        user_id: str = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid refresh token")

        user = db.query(User).filter(User.id == int(user_id)).first()
        if not user:
            raise HTTPException(status_code=401, detail="User not found")

        new_access_token = create_access_token(data={"sub": user_id})
        return {"access_token": new_access_token, "token_type": "bearer"}
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))

# Verify Password
def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifies a plain text password against a hashed password.
    """
    return pwd_context.verify(plain_password, hashed_password)

# Hash Password
def get_password_hash(password: str) -> str:
    """
    Hashes a plain text password.
    """
    return pwd_context.hash(password)

# Authenticate User
def authenticate_user(db: Session, email: str, password: str) -> User:
    """
    Authenticate a user by email and password.
    Email is case-insensitive during authentication.
    """
    normalized_email = email.strip().lower()  # Normalize email
    user = db.query(User).filter(func.lower(User.email) == normalized_email).first()
    if not user or not verify_password(password, user.password):
        return None
    return user

# Create Access and Refresh Tokens
def create_tokens(data: dict) -> dict:
    """
    Generate access and refresh tokens.
    """
    access_token = create_access_token(data)
    refresh_token = create_refresh_token(data)
    return {"access_token": access_token, "refresh_token": refresh_token}

# Get Current User from Token
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    """
    Extracts and validates the current user from the token.
    """
    credentials_exception = HTTPException(
        status_code=401,
        detail="Invalid or expired token. Please log in again.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decode_token(token)  # Use helper function
        user_id: str = payload.get("sub")
        if not user_id:
            raise credentials_exception
    except ValueError as e:
        raise credentials_exception

    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise credentials_exception
    return user

# Exception Handling for Credentials
def handle_credentials_exception() -> HTTPException:
    """
    Returns a 401 exception for invalid credentials.
    """
    return HTTPException(
        status_code=401,
        detail="Invalid or expired token. Please log in again.",
        headers={"WWW-Authenticate": "Bearer"},
    )
