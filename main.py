from fastapi import FastAPI, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from database import SessionLocal
from models import User, ConsumptionEntry, SpendingEntry, PurchaseLocation
from typing import List, Optional
from datetime import date, datetime
from schemas import UserResponse, LocationResponse, ConsumptionResponse, SpendingResponse
from passlib.context import CryptContext

# Initialize FastAPI app
app = FastAPI()

# Password Hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Database Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


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


# Filter Consumption
@app.get("/consumption/", response_model=List[ConsumptionResponse])
def get_consumption(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    location_id: Optional[int] = None,
    min_liters: Optional[float] = None,
    max_liters: Optional[float] = None,
    sort_by: Optional[str] = "date",
    order: Optional[str] = "asc",
    db: Session = Depends(get_db)
):
    query = db.query(ConsumptionEntry)

    # Filters
    if start_date:
        query = query.filter(ConsumptionEntry.date >= start_date)
    if end_date:
        query = query.filter(ConsumptionEntry.date <= end_date)
    if location_id:
        query = query.filter(ConsumptionEntry.location_id == location_id)
    if min_liters:
        query = query.filter(ConsumptionEntry.liters_consumed >= min_liters)
    if max_liters:
        query = query.filter(ConsumptionEntry.liters_consumed <= max_liters)

    # Sorting
    field = getattr(ConsumptionEntry, sort_by)
    query = query.order_by(field.desc() if order == "desc" else field.asc())

    return query.all()


# ------------------------
# Spending Routes
# ------------------------

# Add Spending
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


# Filter Spending
@app.get("/spending/", response_model=List[SpendingResponse])
def get_spending(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    min_amount: Optional[float] = None,
    max_amount: Optional[float] = None,
    sort_by: Optional[str] = "date",
    order: Optional[str] = "asc",
    db: Session = Depends(get_db)
):
    query = db.query(SpendingEntry)

    # Filters
    if start_date:
        query = query.filter(SpendingEntry.date >= start_date)
    if end_date:
        query = query.filter(SpendingEntry.date <= end_date)

    # Sorting
    field = getattr(SpendingEntry, sort_by)
    query = query.order_by(field.desc() if order == "desc" else field.asc())

    return query.all()
