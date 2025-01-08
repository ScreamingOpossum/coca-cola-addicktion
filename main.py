from fastapi import FastAPI, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session
from database import SessionLocal
from models import User, RoleEnum
from typing import Optional
from datetime import date
from schemas import (
    UserResponse, Token, UserCreate
)
from passlib.context import CryptContext
from fastapi.responses import JSONResponse
import logging
from fastapi.security import OAuth2PasswordRequestForm
from auth import authenticate_user, create_access_token, get_current_user
from dependencies import get_db
from fastapi.middleware.cors import CORSMiddleware

# ------------------------
# Initialize FastAPI App
# ------------------------
app = FastAPI()

# ------------------------
# Enable CORS
# ------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Match frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------------
# Logging Setup
# ------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - [%(levelname)s] - %(message)s",
    handlers=[
        logging.FileHandler("app.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# ------------------------
# Password Hashing
# ------------------------
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ------------------------
# Middleware for Logging Requests
# ------------------------
@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(f"Incoming Request: {request.method} {request.url}")
    logger.info(f"Headers: {request.headers}")
    logger.info(f"Client: {request.client.host}")
    response = await call_next(request)
    logger.info(f"Response Status: {response.status_code}")
    return response


# ------------------------
# Global Error Handling with Logging
# ------------------------

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    logger.warning(f"HTTP Exception: {exc.detail} | Status Code: {exc.status_code}")
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unexpected Error: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={"detail": "An unexpected error occurred. Please try again later."},
    )


# ------------------------
# Root Route
# ------------------------
@app.get("/")
def root():
    logger.info("Root endpoint accessed")
    return {"message": "Welcome to Coca-Cola AdDICKtion!"}


# ------------------------
# User Routes
# ------------------------

@app.post("/auth/register", status_code=201, response_model=UserResponse)
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    logger.info(f"Register Request: {user.email}")

    # Check if email already exists
    existing_user = db.query(User).filter(User.email == user.email).first()
    if existing_user:
        logger.warning("Email already registered.")
        raise HTTPException(status_code=400, detail="Email already registered")

    # Create new user
    new_user = User(
        first_name=user.first_name,  # Matches schema alias
        last_name=user.last_name,
        email=user.email,
        password=pwd_context.hash(user.password),
        date_of_birth=user.date_of_birth,
        monthly_goal=user.monthly_goal,
        role=RoleEnum.user  # Default role is user
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    logger.info(f"User registered successfully: {user.email}")
    return new_user


@app.post("/auth/login", response_model=Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)
):
    logger.info(f"Login attempt: {form_data.username}")

    # Authenticate user
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        logger.warning("Login failed: Invalid credentials")
        raise HTTPException(status_code=401, detail="Incorrect email or password")

    # Create access token
    access_token = create_access_token(data={"sub": str(user.id)})
    logger.info("Login successful")
    return {"access_token": access_token, "token_type": "bearer"}


@app.get("/profile", response_model=UserResponse)
def get_profile(current_user: User = Depends(get_current_user)):
    logger.info(f"Profile access: {current_user.email}")
    return UserResponse(
        id=current_user.id,
        first_name=current_user.first_name,
        last_name=current_user.last_name,
        email=current_user.email,
        date_of_birth=current_user.date_of_birth,
        monthly_goal=current_user.monthly_goal,
        role=current_user.role,
        created_at=current_user.created_at.date()  # Ensure date format
    )


# ------------------------
# Debugging Route
# ------------------------
@app.get("/debug")
def debug():
    logger.debug("Debug endpoint accessed")
    return {"debug": "This is a debug route"}
