from fastapi import FastAPI, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session
from database import SessionLocal
from models import User, ConsumptionEntry, SpendingEntry, PurchaseLocation
from typing import List, Optional
from datetime import date, datetime
from schemas import UserResponse, LocationResponse, ConsumptionResponse, SpendingResponse
from passlib.context import CryptContext
from fastapi.responses import JSONResponse
import logging

# ------------------------
# Initialize FastAPI App
# ------------------------
app = FastAPI()

# ------------------------
# Logging Setup
# ------------------------
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ------------------------
# Password Hashing
# ------------------------
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ------------------------
# Database Dependency
# ------------------------
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ------------------------
# Global Error Handling
# ------------------------

# Handle HTTP Exceptions
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    logger.warning(f"HTTP Exception: {exc.detail}")
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
    )


# Handle Validation Errors
@app.exception_handler(ValueError)
async def value_error_handler(request: Request, exc: ValueError):
    logger.error(f"ValueError: {str(exc)}")
    return JSONResponse(
        status_code=400,
        content={"detail": "Invalid input provided."},
    )


# Handle General Exceptions
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
    return {"message": "Welcome to Coca-Cola AdDICKtion!"}


# ------------------------
# User Routes
# ------------------------

# Create User
@app.post("/users/", status_code=201, response_model=UserResponse)
def create_user(
    first_name: str,
    last_name: str,
    email: str,
    password: str,
    date_of_birth: date,
    db: Session = Depends(get_db)
):
    # Check if email already exists
    existing_user = db.query(User).filter(User.email == email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Hash password
    hashed_password = pwd_context.hash(password)

    # Create new user
    new_user = User(
        first_name=first_name,
        last_name=last_name,
        email=email,
        password=hashed_password,
        date_of_birth=date_of_birth,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


# Filter Users
@app.get("/users/", response_model=List[UserResponse])
def get_users(
    name: Optional[str] = None,
    email: Optional[str] = None,
    min_age: Optional[int] = None,
    max_age: Optional[int] = None,
    sort_by: Optional[str] = Query("created_at", regex="^(created_at|first_name)$"),
    order: Optional[str] = "asc",
    db: Session = Depends(get_db)
):
    query = db.query(User)
    today = datetime.now().date()

    # Filters
    if name:
        query = query.filter(
            (User.first_name.ilike(f"%{name}%")) | (User.last_name.ilike(f"%{name}%"))
        )
    if email:
        query = query.filter(User.email == email)
    if min_age:
        min_date = today.replace(year=today.year - min_age)
        query = query.filter(User.date_of_birth <= min_date)
    if max_age:
        max_date = today.replace(year=today.year - max_age)
        query = query.filter(User.date_of_birth >= max_date)

    # Sorting
    field = getattr(User, sort_by)
    query = query.order_by(field.desc() if order == "desc" else field.asc())

    return query.all()


# ------------------------
# Location Routes
# ------------------------

# Add New Location
@app.post("/locations/", status_code=201, response_model=LocationResponse)
def create_location(
    store_name: str,
    city: str = "Minsk",
    db: Session = Depends(get_db)
):
    # Check if location exists
    existing_location = db.query(PurchaseLocation).filter(
        PurchaseLocation.store_name == store_name,
        PurchaseLocation.city == city
    ).first()
    if existing_location:
        raise HTTPException(status_code=400, detail="Location already exists")

    # Create location
    new_location = PurchaseLocation(store_name=store_name, city=city)
    db.add(new_location)
    db.commit()
    db.refresh(new_location)
    return new_location


# Filter Locations
@app.get("/locations/", response_model=List[LocationResponse])
def get_locations(
    city: Optional[str] = None,
    store_name: Optional[str] = None,
    sort_by: Optional[str] = Query("store_name", regex="^(store_name|city)$"),
    order: Optional[str] = "asc",
    db: Session = Depends(get_db)
):
    query = db.query(PurchaseLocation)

    # Filters
    if city:
        query = query.filter(PurchaseLocation.city == city)
    if store_name:
        query = query.filter(PurchaseLocation.store_name.ilike(f"%{store_name}%"))

    # Sorting
    field = getattr(PurchaseLocation, sort_by)
    query = query.order_by(field.desc() if order == "desc" else field.asc())

    return query.all()


# ------------------------
# Consumption Routes
# ------------------------

# Add Consumption
@app.post("/consumption/", status_code=201, response_model=ConsumptionResponse)
def add_consumption(
    user_id: int,
    liters_consumed: float,
    date: date,
    location_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    # Create consumption entry
    new_entry = ConsumptionEntry(
        user_id=user_id,
        liters_consumed=liters_consumed,
        date=date,
        location_id=location_id,
    )
    db.add(new_entry)
    db.commit()
    db.refresh(new_entry)
    return new_entry


# ------------------------
# Spending Routes
# ------------------------

@app.post("/spending/", status_code=201, response_model=SpendingResponse)
def add_spending(
    user_id: int,
    amount_spent: float,
    date: date,
    location_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    new_entry = SpendingEntry(
        user_id=user_id,
        amount_spent=amount_spent,
        date=date,
        location_id=location_id,
    )
    db.add(new_entry)
    db.commit()
    db.refresh(new_entry)
    return new_entry
