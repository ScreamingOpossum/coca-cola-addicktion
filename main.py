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
from datetime import date, timedelta
from sqlalchemy import func, desc
import logging
from auth import auth_router
from fastapi import Query

# Initialize FastAPI app
app = FastAPI()
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

        # Update fields
        user.first_name = user_update.first_name
        user.last_name = user_update.last_name
        user.monthly_goal = user_update.monthly_goal
        user.date_of_birth = user_update.date_of_birth

        # Commit the changes
        db.add(user)
        db.commit()
        db.refresh(user)

        return user
    except Exception as e:
        db.rollback()
        print(f"Error updating profile: {e}")
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
        monthly_average = (
            (monthly_data.total or 0) / monthly_data.unique_days
            if monthly_data and monthly_data.unique_days > 0
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
    limit: int = Query(8, ge=1),  # Items per page (default is 8)
):
    logger.info(f"Fetching paginated consumption history for user: {current_user.id}")
    try:
        offset = (page - 1) * limit  # Calculate the offset for pagination

        query = db.query(
            func.date_trunc("month", ConsumptionEntry.date).label("month"),
            func.sum(ConsumptionEntry.liters_consumed).label("total_consumption"),
            func.count(func.distinct(ConsumptionEntry.date)).label("unique_days"),
            func.max(ConsumptionEntry.liters_consumed).label("highest_consumption"),
            func.array_agg(ConsumptionEntry.date).label("dates"),
            func.array_agg(ConsumptionEntry.liters_consumed).label("liters"),
            func.array_agg(ConsumptionEntry.notes).label("notes"),
        ).filter(
            ConsumptionEntry.user_id == current_user.id
        ).group_by(
            func.date_trunc("month", ConsumptionEntry.date)
        ).order_by(
            desc("month")
        )

        total_entries = query.count()  # Total records for pagination
        paginated_query = query.offset(offset).limit(limit).all()

        response = []
        for result in paginated_query:
            month = result.month.strftime("%B %Y") if result.month else "Unknown"
            entries = [
                {"date": date.strftime("%Y-%m-%d"), "liters_consumed": liters, "notes": notes or "N/A"}
                for date, liters, notes in zip(result.dates, result.liters, result.notes)
            ]
            highest_date = (
                result.dates[result.liters.index(result.highest_consumption)].strftime("%Y-%m-%d")
                if result.highest_consumption else "N/A"
            )
            response.append({
                "month": month,
                "total_consumption": result.total_consumption or 0,
                "average_daily_consumption": round(result.total_consumption / result.unique_days, 2) if result.unique_days else 0,
                "highest_consumption": {
                    "liters": result.highest_consumption or 0,
                    "date": highest_date,
                },
                "entries": entries,
            })

        total_pages = (total_entries + limit - 1) // limit  # Calculate total pages

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
    limit: int = Query(8, ge=1),  # Items per page (default is 8)
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
            func.array_agg(SpendingEntry.date).label("dates"),
            func.array_agg(SpendingEntry.amount_spent).label("amounts"),
            func.array_agg(SpendingEntry.liters).label("liters"),  # Aggregate liters
            func.array_agg(SpendingEntry.store).label("stores"),
            func.array_agg(SpendingEntry.city).label("cities"),
            func.array_agg(SpendingEntry.notes).label("notes"),
        ).filter(
            SpendingEntry.user_id == current_user.id
        ).group_by(
            func.date_trunc("month", SpendingEntry.date)
        ).order_by(desc("month"))

        total_entries = query.count()  # Total records for pagination
        paginated_query = query.offset(offset).limit(limit).all()

        response = []
        for result in paginated_query:
            month = result.month.strftime("%B %Y") if result.month else "Unknown"
            entries = [
                {
                    "date": date.strftime("%Y-%m-%d"),
                    "amount_spent": amount,
                    "liters": liters or 0,
                    "store": store or "N/A",
                    "city": city or "N/A",
                    "notes": notes or "N/A",
                }
                for date, amount, liters, store, city, notes in zip(
                    result.dates, result.amounts, result.liters, result.stores, result.cities, result.notes
                )
            ]
            highest_date = (
                result.dates[result.amounts.index(result.highest_spending)].strftime("%Y-%m-%d")
                if result.highest_spending else "N/A"
            )
            response.append({
                "month": month,
                "total_spending": result.total_spending or 0,
                "total_liters": result.total_liters or 0,  # Include total liters for the month
                "average_daily_spending": round(result.total_spending / result.unique_days, 2) if result.unique_days else 0,
                "highest_spending": {
                    "amount": result.highest_spending or 0,
                    "date": highest_date,
                },
                "entries": entries,
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
