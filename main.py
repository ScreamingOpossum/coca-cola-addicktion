from fastapi import FastAPI, Depends, HTTPException, Request, Body
from sqlalchemy.orm import Session
from database import SessionLocal
from models import User, RoleEnum, ConsumptionEntry, SpendingEntry
from schemas import Token, UserCreate, UserResponse, ConsumptionCreate, ConsumptionResponse, SpendingCreate, SpendingResponse
from passlib.context import CryptContext
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from auth import authenticate_user, create_access_token, get_current_user
from dependencies import get_db
from datetime import date, timedelta
from sqlalchemy import func, desc
import logging

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
        logging.StreamHandler(),
    ],
)
logger = logging.getLogger(__name__)
logger.info("Logging system is working.")

# Password hashing setup
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Middleware to log incoming requests
@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(f"Incoming Request: {request.method} {request.url}")
    response = await call_next(request)
    logger.info(f"Response Status: {response.status_code}")
    return response

# Dependency to get database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# User login endpoint
@app.post("/auth/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    logger.info(f"Login attempt for username: {form_data.username}")
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Incorrect email or password")

    access_token = create_access_token(data={"sub": str(user.id)})
    logger.info(f"Login successful for username: {form_data.username}")
    return {"access_token": access_token, "token_type": "bearer"}

# User logout endpoint
@app.post("/auth/logout", status_code=200)
def logout(current_user: User = Depends(get_current_user)):
    logger.info(f"Logout request for user ID: {current_user.id}")
    return {"message": "Logged out successfully"}

# User registration endpoint
@app.post("/auth/register", response_model=UserResponse, status_code=201)
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    logger.info(f"Register Request: {user.email}")
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
    logger.info(f"User registered successfully: {user.email}")
    return new_user

# Dashboard metrics endpoint
@app.get("/dashboard")
def get_dashboard_metrics(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    logger.info(f"Fetching dashboard metrics for user: {current_user.id}")
    try:
        today = date.today()
        start_of_week = today - timedelta(days=today.weekday())

        # Today's Consumption
        today_consumption = db.query(func.sum(ConsumptionEntry.liters_consumed)).filter(
            ConsumptionEntry.date == today,
            ConsumptionEntry.user_id == current_user.id
        ).scalar() or 0

        # Weekly Consumption
        weekly_consumption = db.query(func.sum(ConsumptionEntry.liters_consumed)).filter(
            ConsumptionEntry.date >= start_of_week,
            ConsumptionEntry.date <= today,
            ConsumptionEntry.user_id == current_user.id
        ).scalar() or 0

        # Monthly Consumption and Average
        monthly_data = db.query(
            func.sum(ConsumptionEntry.liters_consumed).label("total"),
            func.count(func.distinct(ConsumptionEntry.date)).label("unique_days")
        ).filter(
            func.date_trunc('month', ConsumptionEntry.date) == func.date_trunc('month', today),
            ConsumptionEntry.user_id == current_user.id
        ).first()

        monthly_consumption = monthly_data.total or 0
        monthly_average = round(monthly_consumption / monthly_data.unique_days,
                                2) if monthly_data.unique_days > 0 else 0

        # Today's Spending
        today_spending = db.query(func.sum(SpendingEntry.amount_spent)).filter(
            SpendingEntry.date == today,
            SpendingEntry.user_id == current_user.id
        ).scalar() or 0

        # Weekly Spending
        weekly_spending = db.query(func.sum(SpendingEntry.amount_spent)).filter(
            SpendingEntry.date >= start_of_week,
            SpendingEntry.date <= today,
            SpendingEntry.user_id == current_user.id
        ).scalar() or 0

        # Monthly Spending
        monthly_spending = db.query(func.sum(SpendingEntry.amount_spent)).filter(
            func.date_trunc('month', SpendingEntry.date) == func.date_trunc('month', today),
            SpendingEntry.user_id == current_user.id
        ).scalar() or 0

        # Highest Consumption
        highest_consumption_entry = db.query(ConsumptionEntry).filter(
            ConsumptionEntry.user_id == current_user.id
        ).order_by(ConsumptionEntry.liters_consumed.desc()).first()

        highest_consumption = {
            "liters": highest_consumption_entry.liters_consumed if highest_consumption_entry else 0,
            "date": highest_consumption_entry.date.strftime('%Y-%m-%d') if highest_consumption_entry else "N/A",
        }

        # Highest Spending
        highest_spending_entry = db.query(SpendingEntry).filter(
            SpendingEntry.user_id == current_user.id
        ).order_by(SpendingEntry.amount_spent.desc()).first()

        highest_spending = {
            "amount": highest_spending_entry.amount_spent if highest_spending_entry else 0,
            "date": highest_spending_entry.date.strftime('%Y-%m-%d') if highest_spending_entry else "N/A",
        }

        # Weekly Trends
        weekly_trends = [
            {
                "name": (start_of_week + timedelta(days=i)).strftime("%A"),
                "liters": db.query(func.sum(ConsumptionEntry.liters_consumed)).filter(
                    ConsumptionEntry.date == (start_of_week + timedelta(days=i)),
                    ConsumptionEntry.user_id == current_user.id
                ).scalar() or 0,
                "amount": db.query(func.sum(SpendingEntry.amount_spent)).filter(
                    SpendingEntry.date == (start_of_week + timedelta(days=i)),
                    SpendingEntry.user_id == current_user.id
                ).scalar() or 0,
            }
            for i in range(7)
        ]

        return {
            "todayConsumption": today_consumption,
            "weeklyConsumption": weekly_consumption,
            "monthlyConsumption": monthly_consumption,
            "monthlyAverage": monthly_average,
            "todaySpending": today_spending,
            "weeklySpending": weekly_spending,
            "monthlySpending": monthly_spending,
            "highestConsumption": highest_consumption,
            "highestSpending": highest_spending,
            "weeklyTrends": weekly_trends,
        }

    except Exception as e:
        logger.error(f"Error fetching dashboard metrics: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to fetch dashboard metrics")

# Fetch monthly consumption data
@app.get("/consumption/history")
def get_monthly_consumption_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    logger.info(f"Fetching monthly consumption history for user: {current_user.id}")
    try:
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
        ).order_by(desc("month")).all()

        response = []
        for result in query:
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

        logger.info(f"Monthly consumption history fetched successfully for user: {current_user.id}")
        return {"data": response}

    except Exception as e:
        logger.error(f"Error fetching monthly consumption history for user {current_user.id}: {e}")
        raise HTTPException(status_code=500, detail="An error occurred while fetching consumption history")

# Fetch monthly spending data
@app.get("/spending/history")
def get_monthly_spending_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    logger.info(f"Fetching monthly spending history for user: {current_user.id}")
    try:
        query = db.query(
            func.date_trunc("month", SpendingEntry.date).label("month"),
            func.sum(SpendingEntry.amount_spent).label("total_spending"),
            func.count(func.distinct(SpendingEntry.date)).label("unique_days"),
            func.max(SpendingEntry.amount_spent).label("highest_spending"),
            func.array_agg(SpendingEntry.date).label("dates"),
            func.array_agg(SpendingEntry.amount_spent).label("amounts"),
            func.array_agg(SpendingEntry.notes).label("notes"),
        ).filter(
            SpendingEntry.user_id == current_user.id
        ).group_by(
            func.date_trunc("month", SpendingEntry.date)
        ).order_by(desc("month")).all()

        response = []
        for result in query:
            month = result.month.strftime("%B %Y") if result.month else "Unknown"
            entries = [
                {
                    "date": date.strftime("%Y-%m-%d"),
                    "amount_spent": amount,
                    "notes": notes or "N/A",
                }
                for date, amount, notes in zip(
                    result.dates, result.amounts, result.notes
                )
            ]
            highest_date = (
                result.dates[result.amounts.index(result.highest_spending)].strftime("%Y-%m-%d")
                if result.highest_spending else "N/A"
            )
            response.append({
                "month": month,
                "total_spending": result.total_spending or 0,
                "average_daily_spending": round(result.total_spending / result.unique_days, 2) if result.unique_days else 0,
                "highest_spending": {
                    "amount": result.highest_spending or 0,
                    "date": highest_date,
                },
                "entries": entries,
            })

        logger.info(f"Monthly spending history fetched successfully for user: {current_user.id}")
        return {"data": response}

    except Exception as e:
        logger.error(f"Error fetching monthly spending history for user {current_user.id}: {e}")
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

    new_entry = SpendingEntry(
        user_id=current_user.id,
        date=spending.date,
        amount_spent=spending.amount_spent,
        liters=liters,
        store=spending.store,
        city=spending.city,
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
