from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from database import SessionLocal
from models import User, ConsumptionEntry, SpendingEntry, PurchaseLocation

# Create FastAPI App
app = FastAPI()

# Dependency to get the database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- Test Route ---
@app.get("/")
def root():
    return {"message": "Welcome to Coca-Cola AdDICKtion!"}

# --- Create User ---
@app.post("/users/")
def create_user(
    first_name: str,
    last_name: str,
    email: str,
    password: str,
    date_of_birth: str,
    db: Session = Depends(get_db)
):
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Create a new user
    new_user = User(
        first_name=first_name,
        last_name=last_name,
        email=email,
        password=password,  # In production, hash the password!
        date_of_birth=date_of_birth,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {"id": new_user.id, "email": new_user.email}

# --- Get All Users ---
@app.get("/users/")
def get_users(db: Session = Depends(get_db)):
    users = db.query(User).all()
    return users

# --- Add New Location ---
@app.post("/locations/")
def create_location(
    store_name: str,
    city: str = "Minsk",  # Default city is Minsk
    db: Session = Depends(get_db)
):
    # Check if location already exists
    existing_location = db.query(PurchaseLocation).filter(
        PurchaseLocation.store_name == store_name,
        PurchaseLocation.city == city
    ).first()
    if existing_location:
        raise HTTPException(status_code=400, detail="Location already exists")

    # Create new location
    new_location = PurchaseLocation(store_name=store_name, city=city)
    db.add(new_location)
    db.commit()
    db.refresh(new_location)

    return {"id": new_location.id, "store_name": new_location.store_name}


# --- Get All Locations ---
@app.get("/locations/")
def get_locations(db: Session = Depends(get_db)):
    locations = db.query(PurchaseLocation).all()
    return locations

# --- Add Consumption Entry ---
@app.post("/consumption/")
def add_consumption(
    user_id: int,
    liters_consumed: float,
    date: str,
    location_id: int = None,
    db: Session = Depends(get_db)
):
    # Validate user
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Validate location (if provided)
    if location_id:
        location = db.query(PurchaseLocation).filter(PurchaseLocation.id == location_id).first()
        if not location:
            raise HTTPException(status_code=404, detail="Location not found")

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

    return {"id": new_entry.id, "liters_consumed": new_entry.liters_consumed}


# --- Get All Consumption Entries ---
@app.get("/consumption/")
def get_consumption(db: Session = Depends(get_db)):
    consumption = db.query(ConsumptionEntry).all()
    return consumption

# --- Add Spending Entry ---
@app.post("/spending/")
def add_spending(
    user_id: int,
    amount_spent: float,
    date: str,
    location_id: int = None,
    db: Session = Depends(get_db)
):
    # Validate user
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Validate location (if provided)
    if location_id:
        location = db.query(PurchaseLocation).filter(PurchaseLocation.id == location_id).first()
        if not location:
            raise HTTPException(status_code=404, detail="Location not found")

    # Create spending entry
    new_entry = SpendingEntry(
        user_id=user_id,
        amount_spent=amount_spent,
        date=date,
        location_id=location_id,
    )
    db.add(new_entry)
    db.commit()
    db.refresh(new_entry)

    return {"id": new_entry.id, "amount_spent": new_entry.amount_spent}


# --- Get All Spending Entries ---
@app.get("/spending/")
def get_spending(db: Session = Depends(get_db)):
    spending = db.query(SpendingEntry).all()
    return spending


