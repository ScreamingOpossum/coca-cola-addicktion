from fastapi import FastAPI, Depends, HTTPException, Request, Body
from sqlalchemy.orm import Session
from database import SessionLocal
from models import User, RoleEnum, ConsumptionEntry, SpendingEntry
from schemas import (
    Token,
    UserCreate,
    UserResponse,
    ConsumptionCreate,
    ConsumptionResponse,
    SpendingCreate,
    SpendingResponse,
    UserProfileResponse,
    UserProfileUpdate,
    UserUpdateSchema,
)
from passlib.context import CryptContext
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from auth import authenticate_user, create_access_token, get_current_user
from dependencies import get_db
from datetime import date, timedelta, datetime
from sqlalchemy import func, desc
import logging
from auth import auth_router
from fastapi import Query
from calendar import monthrange

# Initialize FastAPI app
app = FastAPI()

# Initialize router
app.include_router(auth_router)

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
        logging.StreamHandler(),
    ],
)
logger = logging.getLogger(__name__)
logger.info("Logging system initialized.")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Dependency to get database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Middleware to log requests
@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(f"Request: {request.method} {request.url}")
    response = await call_next(request)
    logger.info(f"Response: {response.status_code}")
    return response

# Get the current date and month details
today = date.today()
days_in_month = monthrange(today.year, today.month)[1]  # Total days in the current month
days_up_to_today = today.day  # Days elapsed up to today

# User Login
@app.post("/auth/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token({"sub": str(user.id)})
    return {"access_token": token, "token_type": "bearer"}

# User Logout
@app.post("/auth/logout")
def logout():
    return {"message": "Logout successful"}

# User Registration
@app.post("/auth/register", response_model=UserResponse)
def register(user: UserCreate, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == user.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed_password = pwd_context.hash(user.password)
    new_user = User(
        first_name=user.first_name,
        last_name=user.last_name,
        email=user.email,
        password=hashed_password,
        role=RoleEnum.user,
        date_of_birth=user.date_of_birth,
        monthly_goal=user.monthly_goal,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

# Get user profile
@app.get("/user/profile", response_model=UserProfileResponse)
def get_user_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    today = date.today()
    monthly_data = db.query(func.sum(ConsumptionEntry.liters_consumed)).filter(
        func.date_trunc("month", ConsumptionEntry.date) == func.date_trunc("month", today),
        ConsumptionEntry.user_id == current_user.id
    ).first()

    profile = {
        "id": current_user.id,
        "first_name": current_user.first_name,
        "last_name": current_user.last_name,
        "email": current_user.email,
        "date_of_birth": current_user.date_of_birth,
        "monthly_goal": current_user.monthly_goal,
        "income": current_user.income,  # Added income field
        "current_month_consumption": monthly_data[0] or 0.0,
    }

    logger.info(f"Fetched profile: {profile}")
    return profile

# Update user profile
@app.put("/user/profile", response_model=UserUpdateSchema)
def update_user_profile(
    user_update: UserUpdateSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        # Re-fetch the user object in the same session
        user = db.query(User).filter(User.id == current_user.id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Update fields only if they are provided
        if user_update.first_name is not None:
            user.first_name = user_update.first_name
        if user_update.last_name is not None:
            user.last_name = user_update.last_name
        if user_update.monthly_goal is not None:
            user.monthly_goal = user_update.monthly_goal
        if user_update.date_of_birth is not None:
            user.date_of_birth = user_update.date_of_birth
        if user_update.income is not None:  # Added income update
            user.income = user_update.income

        # Commit the changes
        db.add(user)
        db.commit()
        db.refresh(user)

        return user
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating profile: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

# Dashboard metrics endpoint
@app.get("/dashboard")
def get_dashboard_metrics(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    try:
        today = date.today()
        start_of_week = today - timedelta(days=today.weekday())  # Monday
        end_of_week = start_of_week + timedelta(days=6)  # Sunday
        start_of_year = date(today.year, 1, 1)

        # Today's Consumption
        today_consumption = (
            db.query(func.sum(ConsumptionEntry.liters_consumed))
            .filter(
                ConsumptionEntry.date == today,
                ConsumptionEntry.user_id == current_user.id,
            )
            .scalar()
            or 0
        )

        # Weekly Consumption
        weekly_consumption = (
            db.query(func.sum(ConsumptionEntry.liters_consumed))
            .filter(
                ConsumptionEntry.date >= start_of_week,
                ConsumptionEntry.date <= end_of_week,
                ConsumptionEntry.user_id == current_user.id,
            )
            .scalar()
            or 0
        )

        # Average Monthly Consumption
        monthly_data = (
            db.query(
                func.sum(ConsumptionEntry.liters_consumed).label("total"),
                func.count(func.distinct(ConsumptionEntry.date)).label("unique_days"),
            )
            .filter(
                func.date_trunc("month", ConsumptionEntry.date)
                == func.date_trunc("month", today),
                ConsumptionEntry.user_id == current_user.id,
            )
            .first()
        )

        # Adjust monthly_average logic
        monthly_average = (
            (monthly_data.total or 0) / days_up_to_today
            if monthly_data and days_up_to_today > 0
            else 0
        )

        # Yearly Consumption
        yearly_consumption = (
                db.query(func.sum(ConsumptionEntry.liters_consumed))
                .filter(
                    func.date_trunc("year", ConsumptionEntry.date) == func.date_trunc("year", today),
                    ConsumptionEntry.user_id == current_user.id,
                )
                .scalar()
                or 0
        )

        # Highest Consumption
        highest_consumption_entry = (
            db.query(ConsumptionEntry)
            .filter(ConsumptionEntry.user_id == current_user.id)
            .order_by(ConsumptionEntry.liters_consumed.desc())
            .first()
        )
        highest_consumption = {
            "liters": highest_consumption_entry.liters_consumed
            if highest_consumption_entry
            else 0,
            "date": highest_consumption_entry.date.strftime("%Y-%m-%d")
            if highest_consumption_entry
            else "N/A",
        }

        # Today's Spending
        today_spending = (
            db.query(func.sum(SpendingEntry.amount_spent))
            .filter(
                SpendingEntry.date == today,
                SpendingEntry.user_id == current_user.id,
            )
            .scalar()
            or 0
        )

        # Weekly Spending
        weekly_spending = (
            db.query(func.sum(SpendingEntry.amount_spent))
            .filter(
                SpendingEntry.date >= start_of_week,
                SpendingEntry.date <= end_of_week,
                SpendingEntry.user_id == current_user.id,
            )
            .scalar()
            or 0
        )

        # Monthly Spending
        monthly_spending = (
            db.query(func.sum(SpendingEntry.amount_spent))
            .filter(
                func.date_trunc("month", SpendingEntry.date)
                == func.date_trunc("month", today),
                SpendingEntry.user_id == current_user.id,
            )
            .scalar()
            or 0
        )

        # Yearly Spending
        yearly_spending = (
                db.query(func.sum(SpendingEntry.amount_spent))
                .filter(
                    func.date_trunc("year", SpendingEntry.date) == func.date_trunc("year", today),
                    SpendingEntry.user_id == current_user.id,
                )
                .scalar()
                or 0
        )

        # Highest Spending
        highest_spending_entry = (
            db.query(SpendingEntry)
            .filter(SpendingEntry.user_id == current_user.id)
            .order_by(SpendingEntry.amount_spent.desc())
            .first()
        )
        highest_spending = {
            "amount": highest_spending_entry.amount_spent
            if highest_spending_entry
            else 0,
            "date": highest_spending_entry.date.strftime("%Y-%m-%d")
            if highest_spending_entry
            else "N/A",
        }

        # Weekly Trends
        weekly_trends = [
            {
                "name": (start_of_week + timedelta(days=i)).strftime("%A"),
                "liters": (
                    db.query(func.sum(ConsumptionEntry.liters_consumed))
                    .filter(
                        ConsumptionEntry.date == (start_of_week + timedelta(days=i)),
                        ConsumptionEntry.user_id == current_user.id,
                    )
                    .scalar()
                    or 0
                ),
                "amount": (
                    db.query(func.sum(SpendingEntry.amount_spent))
                    .filter(
                        SpendingEntry.date == (start_of_week + timedelta(days=i)),
                        SpendingEntry.user_id == current_user.id,
                    )
                    .scalar()
                    or 0
                ),
            }
            for i in range(7)
        ]

        return {
            "todayConsumption": today_consumption,
            "weeklyConsumption": weekly_consumption,
            "monthlyAverage": monthly_average,
            "yearlyConsumption": yearly_consumption,
            "highestConsumption": highest_consumption,
            "todaySpending": today_spending,
            "weeklySpending": weekly_spending,
            "monthlySpending": monthly_spending,
            "yearlySpending": yearly_spending,
            "highestSpending": highest_spending,
            "weeklyTrends": weekly_trends,
        }

    except Exception as e:
        logger.error(f"Error fetching dashboard metrics: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch dashboard metrics")

# Fetch monthly consumption data
@app.get("/consumption/history")
def get_monthly_consumption_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    page: int = Query(1, ge=1),  # Page number (default is 1)
    limit: int = Query(5, ge=1),  # Items per page (default is 5)
):
    logger.info(f"Fetching paginated consumption history for user: {current_user.id}")
    try:
        offset = (page - 1) * limit  # Calculate the offset for pagination

        # Fetch aggregated data by month
        query = db.query(
            func.date_trunc("month", ConsumptionEntry.date).label("month"),
            func.sum(ConsumptionEntry.liters_consumed).label("total_consumption"),
            func.count(func.distinct(ConsumptionEntry.date)).label("unique_days"),
            func.max(ConsumptionEntry.liters_consumed).label("highest_consumption"),
            func.array_agg(
                func.json_build_object(
                    "date", ConsumptionEntry.date,
                    "liters_consumed", ConsumptionEntry.liters_consumed,
                    "notes", ConsumptionEntry.notes,
                    "id", ConsumptionEntry.id
                )
            ).label("entries"),
        ).filter(
            ConsumptionEntry.user_id == current_user.id
        ).group_by(
            func.date_trunc("month", ConsumptionEntry.date)
        ).order_by(
            desc("month")
        )

        total_entries = query.count()  # Total records for pagination
        paginated_query = query.offset(offset).limit(limit).all()

        if not paginated_query:
            logger.info(f"No consumption history found for user: {current_user.id}")
            return {"data": [], "total_pages": 0}

        response = []
        for result in paginated_query:
            # Convert the month from datetime to string
            month = result.month.strftime("%B %Y") if isinstance(result.month, datetime) else str(result.month)

            # Process entries
            entries = []
            for entry in result.entries:
                try:
                    entry_date = entry.get("date")
                    if isinstance(entry_date, datetime):
                        formatted_date = entry_date.strftime("%Y-%m-%d")
                    elif isinstance(entry_date, str):
                        formatted_date = datetime.strptime(entry_date, "%Y-%m-%d").strftime("%Y-%m-%d")
                    else:
                        formatted_date = None  # Handle unexpected formats gracefully

                    entries.append({
                        "date": formatted_date,
                        "liters_consumed": entry.get("liters_consumed", 0),
                        "notes": entry.get("notes", "N/A"),
                        "id": entry.get("id"),
                    })
                except Exception as ex:
                    logger.warning(f"Skipping invalid entry: {entry}, error: {ex}")

            # Sort entries: descending by date and then descending by ID within each date
            sorted_entries = sorted(
                entries,
                key=lambda x: (
                    datetime.strptime(x["date"], "%Y-%m-%d"),  # Sort by date (ascending)
                    x["id"]  # Sort by ID (ascending within date)
                ),
                reverse=True  # Reverse to make date descending
            )

            # Determine highest consumption date
            highest_entry = max(sorted_entries, key=lambda x: x["liters_consumed"], default=None)
            highest_date = highest_entry["date"] if highest_entry else "N/A"
            highest_liters = highest_entry["liters_consumed"] if highest_entry else 0

            response.append({
                "month": month,
                "total_consumption": result.total_consumption or 0,
                "average_daily_consumption": round(result.total_consumption / result.unique_days, 2) if result.unique_days else 0,
                "highest_consumption": {
                    "liters": highest_liters,
                    "date": highest_date,
                },
                "entries": sorted_entries,
            })

        total_pages = (total_entries + limit - 1) // limit

        return {"data": response, "total_pages": total_pages}

    except Exception as e:
        logger.error(f"Error fetching paginated consumption history for user {current_user.id}: {e}")
        raise HTTPException(status_code=500, detail="An error occurred while fetching consumption history")

# Fetch monthly spending data
@app.get("/spending/history")
def get_monthly_spending_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    page: int = Query(1, ge=1),  # Page number (default is 1)
    limit: int = Query(5, ge=1),  # Items per page (default is 8)
):
    logger.info(f"Fetching paginated spending history for user: {current_user.id}")
    try:
        offset = (page - 1) * limit  # Calculate the offset for pagination

        query = db.query(
            func.date_trunc("month", SpendingEntry.date).label("month"),
            func.sum(SpendingEntry.amount_spent).label("total_spending"),
            func.sum(SpendingEntry.liters).label("total_liters"),  # Total liters
            func.count(func.distinct(SpendingEntry.date)).label("unique_days"),
            func.max(SpendingEntry.amount_spent).label("highest_spending"),
            func.array_agg(
                func.json_build_object(
                    "date", SpendingEntry.date,
                    "amount_spent", SpendingEntry.amount_spent,
                    "liters", SpendingEntry.liters,
                    "store", SpendingEntry.store,
                    "city", SpendingEntry.city,
                    "notes", SpendingEntry.notes,
                    "id", SpendingEntry.id
                )
            ).label("entries"),
        ).filter(
            SpendingEntry.user_id == current_user.id
        ).group_by(
            func.date_trunc("month", SpendingEntry.date)
        ).order_by(desc("month"))

        total_entries = query.count()  # Total records for pagination
        paginated_query = query.offset(offset).limit(limit).all()

        if not paginated_query:
            logger.info(f"No spending history found for user: {current_user.id}")
            return {"data": [], "total_pages": 0}

        response = []
        for result in paginated_query:
            month = result.month.strftime("%B %Y") if result.month else "Unknown"

            # Process entries
            entries = []
            for entry in result.entries:
                try:
                    entry_date = entry.get("date")
                    if isinstance(entry_date, datetime):
                        formatted_date = entry_date.strftime("%Y-%m-%d")
                    elif isinstance(entry_date, str):
                        formatted_date = datetime.strptime(entry_date, "%Y-%m-%d").strftime("%Y-%m-%d")
                    else:
                        formatted_date = None  # Handle unexpected formats gracefully

                    entries.append({
                        "date": formatted_date,
                        "amount_spent": entry.get("amount_spent", 0),
                        "liters": entry.get("liters", 0),
                        "store": entry.get("store", "N/A"),
                        "city": entry.get("city", "N/A"),
                        "notes": entry.get("notes", "N/A"),
                        "id": entry.get("id"),
                    })
                except Exception as ex:
                    logger.warning(f"Skipping invalid entry: {entry}, error: {ex}")

            # Sort entries: descending by date and then descending by ID within each date
            sorted_entries = sorted(
                entries,
                key=lambda x: (
                    datetime.strptime(x["date"], "%Y-%m-%d"),  # Sort by date (ascending)
                    x["id"]  # Sort by ID (ascending within date)
                ),
                reverse=True  # Reverse to make date descending
            )

            # Determine highest spending date
            highest_entry = max(sorted_entries, key=lambda x: x["amount_spent"], default=None)
            highest_date = highest_entry["date"] if highest_entry else "N/A"
            highest_amount = highest_entry["amount_spent"] if highest_entry else 0

            response.append({
                "month": month,
                "total_spending": result.total_spending or 0,
                "total_liters": result.total_liters or 0,  # Include total liters for the month
                "average_daily_spending": round(result.total_spending / result.unique_days, 2) if result.unique_days else 0,
                "highest_spending": {
                    "amount": highest_amount,
                    "date": highest_date,
                },
                "entries": sorted_entries,
            })

        total_pages = (total_entries + limit - 1) // limit  # Calculate total pages

        return {"data": response, "total_pages": total_pages}

    except Exception as e:
        logger.error(f"Error fetching paginated spending history for user {current_user.id}: {e}")
        raise HTTPException(status_code=500, detail="An error occurred while fetching spending history")

# Add consumption entry
@app.post("/consumption", response_model=ConsumptionResponse)
def add_consumption_entry(
    consumption: ConsumptionCreate = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    logger.info(f"Adding consumption entry for user: {current_user.id}")

    if consumption.liters_consumed <= 0:
        logger.error("Liters consumed must be a positive number")
        raise HTTPException(
            status_code=400, detail="Liters consumed must be a positive number"
        )

    new_entry = ConsumptionEntry(
        user_id=current_user.id,
        date=consumption.date,
        liters_consumed=consumption.liters_consumed,
        notes=consumption.notes,
    )

    db.add(new_entry)
    db.commit()
    db.refresh(new_entry)

    logger.info(f"Consumption entry added successfully: {new_entry}")
    return {
        "id": new_entry.id,
        "date": new_entry.date,
        "liters_consumed": new_entry.liters_consumed,
        "notes": new_entry.notes,
    }

# Add spending entry
@app.post("/spending", response_model=SpendingResponse)
def add_spending_entry(
    spending: SpendingCreate = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    logger.info(f"Adding spending entry for user: {current_user.id}")

    if spending.amount_spent <= 0:
        logger.error("Amount spent must be a positive number")
        raise HTTPException(
            status_code=400, detail="Amount spent must be a positive number"
        )

    liters = spending.liters if spending.liters is not None else 0
    store = spending.store if spending.store else "N/A"
    city = spending.city if spending.city else "N/A"

    new_entry = SpendingEntry(
        user_id=current_user.id,
        date=spending.date,
        amount_spent=spending.amount_spent,
        liters=liters,
        store=store,
        city=city,
        notes=spending.notes,
    )

    db.add(new_entry)
    db.commit()
    db.refresh(new_entry)

    logger.info(f"Spending entry added successfully: {new_entry}")
    return {
        "id": new_entry.id,
        "date": new_entry.date,
        "amount_spent": new_entry.amount_spent,
        "liters": new_entry.liters,
        "store": new_entry.store,
        "city": new_entry.city,
        "notes": new_entry.notes,
    }

#Consumption table update
@app.put("/consumption/{entry_id}", response_model=ConsumptionResponse)
def update_consumption_entry(
    entry_id: int,
    updated_data: ConsumptionCreate = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    logger.info(f"Updating consumption entry {entry_id} for user {current_user.id}")

    entry = db.query(ConsumptionEntry).filter_by(id=entry_id, user_id=current_user.id).first()

    if not entry:
        logger.error("Consumption entry not found or unauthorized access.")
        raise HTTPException(
            status_code=404, detail="Consumption entry not found"
        )

    if updated_data.liters_consumed <= 0:
        logger.error("Liters consumed must be a positive number.")
        raise HTTPException(
            status_code=400, detail="Liters consumed must be a positive number."
        )

    # Update the entry fields
    entry.date = updated_data.date
    entry.liters_consumed = updated_data.liters_consumed
    entry.notes = updated_data.notes

    db.commit()
    db.refresh(entry)

    logger.info(f"Consumption entry updated successfully: {entry}")
    return {
        "id": entry.id,
        "date": entry.date,
        "liters_consumed": entry.liters_consumed,
        "notes": entry.notes,
    }

#Consumption table delete
@app.delete("/consumption/{entry_id}")
def delete_consumption_entry(
    entry_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    logger.info(f"Attempting to delete consumption entry: {entry_id} for user {current_user.id}")
    entry = db.query(ConsumptionEntry).filter(
        ConsumptionEntry.id == entry_id,
        ConsumptionEntry.user_id == current_user.id,
    ).first()

    if not entry:
        logger.error(f"Consumption entry {entry_id} not found for user {current_user.id}")
        raise HTTPException(status_code=404, detail="Consumption entry not found")

    db.delete(entry)
    db.commit()
    logger.info(f"Successfully deleted consumption entry {entry_id}")
    return {"detail": "Consumption entry deleted successfully"}

#Spending update
@app.put("/spending/{entry_id}", response_model=SpendingResponse)
def update_spending_entry(
    entry_id: int,
    updated_spending: SpendingCreate = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    logger.info(f"Updating spending entry ID: {entry_id} for user: {current_user.id}")

    entry = db.query(SpendingEntry).filter(
        SpendingEntry.id == entry_id, SpendingEntry.user_id == current_user.id
    ).first()

    if not entry:
        logger.error(f"Spending entry ID: {entry_id} not found.")
        raise HTTPException(status_code=404, detail="Spending entry not found.")

    if updated_spending.amount_spent <= 0:
        logger.error("Amount spent must be a positive number.")
        raise HTTPException(
            status_code=400, detail="Amount spent must be a positive number."
        )

    entry.date = updated_spending.date
    entry.amount_spent = updated_spending.amount_spent
    entry.liters = updated_spending.liters if updated_spending.liters else 0
    entry.store = updated_spending.store if updated_spending.store else "N/A"
    entry.city = updated_spending.city if updated_spending.city else "N/A"
    entry.notes = updated_spending.notes

    db.commit()
    db.refresh(entry)

    logger.info(f"Spending entry updated successfully: {entry}")
    return {
        "id": entry.id,
        "date": entry.date,
        "amount_spent": entry.amount_spent,
        "liters": entry.liters,
        "store": entry.store,
        "city": entry.city,
        "notes": entry.notes,
    }

#Spending deleting
@app.delete("/spending/{entry_id}", response_model=dict)
def delete_spending_entry(
    entry_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    logger.info(f"Deleting spending entry ID: {entry_id} for user: {current_user.id}")

    entry = db.query(SpendingEntry).filter(
        SpendingEntry.id == entry_id, SpendingEntry.user_id == current_user.id
    ).first()

    if not entry:
        logger.error(f"Spending entry ID: {entry_id} not found.")
        raise HTTPException(status_code=404, detail="Spending entry not found.")

    db.delete(entry)
    db.commit()

    logger.info(f"Spending entry ID: {entry_id} deleted successfully.")
    return {"message": "Spending entry deleted successfully."}

#User Deleting
@app.delete("/user/delete", status_code=204)
def delete_user_account(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        # Fetch the user from the database
        user = db.query(User).filter(User.id == current_user.id).first()

        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Delete the user and their related entries
        db.query(ConsumptionEntry).filter(ConsumptionEntry.user_id == current_user.id).delete()
        db.query(SpendingEntry).filter(SpendingEntry.user_id == current_user.id).delete()
        db.delete(user)
        db.commit()

        logger.info(f"User {current_user.id} deleted successfully")
        return {"message": "Account deleted successfully"}

    except Exception as e:
        logger.error(f"Error deleting user {current_user.id}: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Internal Server Error")
