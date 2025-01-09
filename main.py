from fastapi import FastAPI, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session
from database import SessionLocal
from models import User, RoleEnum, ConsumptionEntry, SpendingEntry
from typing import Optional, List
from datetime import date, timedelta
from schemas import (
    UserResponse, Token, UserCreate, ConsumptionCreate, ConsumptionResponse
)
from passlib.context import CryptContext
from fastapi.responses import JSONResponse
import logging
from fastapi.security import OAuth2PasswordRequestForm
from auth import authenticate_user, create_access_token, get_current_user
from dependencies import get_db
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func

# Initialize FastAPI app
app = FastAPI()

# Enable CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Update with frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Logging setup
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - [%(levelname)s] - %(message)s",
    handlers=[
        logging.FileHandler("app.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Password hashing setup
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Middleware to log incoming requests
@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(f"Incoming Request: {request.method} {request.url}")
    response = await call_next(request)
    logger.info(f"Response Status: {response.status_code}")
    return response

# Root endpoint
@app.get("/")
def root():
    logger.info("Root endpoint accessed")
    return {"message": "Welcome to Coca-Cola AdDICKtion!"}

# User registration endpoint
@app.post("/auth/register", status_code=201, response_model=UserResponse)
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    logger.info(f"Register Request: {user.email}")
    if db.query(User).filter(User.email == user.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    new_user = User(
        first_name=user.first_name,
        last_name=user.last_name,
        email=user.email,
        password=pwd_context.hash(user.password),
        date_of_birth=user.date_of_birth,
        monthly_goal=user.monthly_goal,
        role=RoleEnum.user
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

# User login endpoint
@app.post("/auth/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    logger.info(f"Login attempt: {form_data.username}")
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    access_token = create_access_token(data={"sub": str(user.id)})
    return {"access_token": access_token, "token_type": "bearer"}

# User logout endpoint
@app.post("/auth/logout", status_code=200)
def logout(current_user: User = Depends(get_current_user)):
    logger.info(f"Logout requested for User ID: {current_user.id}")
    return {"message": "Logout successful. Please clear the token on the client side."}

# User profile endpoint
@app.get("/profile", response_model=UserResponse)
def get_profile(current_user: User = Depends(get_current_user)):
    return UserResponse(
        id=current_user.id,
        first_name=current_user.first_name,
        last_name=current_user.last_name,
        email=current_user.email,
        date_of_birth=current_user.date_of_birth,
        monthly_goal=current_user.monthly_goal,
        role=current_user.role,
        created_at=current_user.created_at.date()
    )

# Add consumption entry
@app.post("/consumption", status_code=201, response_model=ConsumptionResponse)
def add_consumption(entry: ConsumptionCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    logger.info(f"Adding consumption entry for User ID: {current_user.id}")
    if not entry.liters_consumed or entry.liters_consumed <= 0:
        raise HTTPException(status_code=400, detail="Liters consumed must be a positive number.")
    try:
        new_entry = ConsumptionEntry(
            user_id=current_user.id,
            date=entry.date,
            liters_consumed=entry.liters_consumed,
            notes=entry.notes,
        )
        db.add(new_entry)
        db.commit()
        db.refresh(new_entry)
        return new_entry
    except Exception as e:
        logger.error(f"Error adding consumption entry: {e}")
        raise HTTPException(status_code=500, detail="Failed to add consumption entry.")

# Get consumption entries
@app.get("/consumption", response_model=List[ConsumptionResponse])
def get_consumptions(db: Session = Depends(get_db), current_user: User = Depends(get_current_user),
                     start_date: Optional[date] = Query(None), end_date: Optional[date] = Query(None)):
    logger.info(f"Fetching consumption entries for User ID: {current_user.id}")
    try:
        query = db.query(ConsumptionEntry).filter(ConsumptionEntry.user_id == current_user.id)
        if start_date:
            query = query.filter(ConsumptionEntry.date >= start_date)
        if end_date:
            query = query.filter(ConsumptionEntry.date <= end_date)
        return query.all()
    except Exception as e:
        logger.error(f"Error fetching consumption entries: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch consumption entries.")

# Dashboard metrics endpoint
@app.get("/dashboard")
def get_dashboard_metrics(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    logger.info(f"Fetching dashboard metrics for User ID: {current_user.id}")
    try:
        today = date.today()
        start_of_week = today - timedelta(days=today.weekday())
        today_consumption = db.query(func.sum(ConsumptionEntry.liters_consumed)).filter(
            ConsumptionEntry.date == today, ConsumptionEntry.user_id == current_user.id
        ).scalar() or 0
        weekly_consumption = db.query(func.sum(ConsumptionEntry.liters_consumed)).filter(
            ConsumptionEntry.date >= start_of_week, ConsumptionEntry.user_id == current_user.id
        ).scalar() or 0
        monthly_consumption = db.query(func.sum(ConsumptionEntry.liters_consumed)).filter(
            ConsumptionEntry.date >= today.replace(day=1), ConsumptionEntry.user_id == current_user.id
        ).scalar() or 0
        total_spending = db.query(func.sum(SpendingEntry.amount_spent)).filter(
            SpendingEntry.user_id == current_user.id
        ).scalar() or 0
        days_in_month = today.day
        monthly_average = monthly_consumption / days_in_month if days_in_month else 0
        weekly_trends = [
            {
                "name": (start_of_week + timedelta(days=i)).strftime("%a"),
                "liters": db.query(func.sum(ConsumptionEntry.liters_consumed)).filter(
                    ConsumptionEntry.date == (start_of_week + timedelta(days=i)),
                    ConsumptionEntry.user_id == current_user.id
                ).scalar() or 0
            }
            for i in range(7)
        ]
        return {
            "todayConsumption": today_consumption,
            "weeklyConsumption": weekly_consumption,
            "monthlyAverage": monthly_average,
            "totalSpending": total_spending,
            "weeklyTrends": weekly_trends,
        }
    except Exception as e:
        logger.error(f"Error fetching dashboard metrics: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch dashboard metrics.")
