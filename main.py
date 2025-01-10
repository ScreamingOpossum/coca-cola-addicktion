from fastapi import FastAPI, Depends, HTTPException, Request, Body
from sqlalchemy.orm import Session
from database import SessionLocal
from models import User, RoleEnum, ConsumptionEntry
from schemas import Token, UserCreate, UserResponse, ConsumptionCreate, ConsumptionResponse
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
logger.info("Test log: Logging system is working.")

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
            func.avg(ConsumptionEntry.liters_consumed).label("average_daily_consumption"),
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
                "average_daily_consumption": round(result.average_daily_consumption, 2) if result.average_daily_consumption else 0,
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


# Dashboard metrics endpoint
@app.get("/dashboard")
def get_dashboard_metrics(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    logger.info(f"Fetching dashboard metrics for user: {current_user.id}")
    try:
        today = date.today()
        start_of_week = today - timedelta(days=today.weekday())

        # Today's Consumption
        logger.info("Querying today's consumption...")
        today_consumption = db.query(
            func.sum(ConsumptionEntry.liters_consumed)
        ).filter(
            ConsumptionEntry.date == today,
            ConsumptionEntry.user_id == current_user.id
        ).scalar() or 0
        logger.info(f"Today's consumption: {today_consumption}")

        # Weekly Consumption
        logger.info("Querying weekly consumption...")
        weekly_consumption = db.query(
            func.sum(ConsumptionEntry.liters_consumed)
        ).filter(
            ConsumptionEntry.date >= start_of_week,
            ConsumptionEntry.date <= today,
            ConsumptionEntry.user_id == current_user.id
        ).scalar() or 0
        logger.info(f"Weekly consumption: {weekly_consumption}")

        # Total Consumption
        logger.info("Querying total consumption...")
        total_consumption = db.query(
            func.sum(ConsumptionEntry.liters_consumed)
        ).filter(
            ConsumptionEntry.user_id == current_user.id
        ).scalar() or 0
        logger.info(f"Total consumption: {total_consumption}")

        # Monthly Consumption
        logger.info("Querying monthly consumption...")
        monthly_consumption = db.query(
            func.sum(ConsumptionEntry.liters_consumed)
        ).filter(
            func.date_trunc('month', ConsumptionEntry.date) == func.date_trunc('month', today),
            ConsumptionEntry.user_id == current_user.id
        ).scalar() or 0
        logger.info(f"Monthly consumption: {monthly_consumption}")

        # Monthly Average
        logger.info("Calculating monthly average...")
        monthly_average = round(monthly_consumption / max(today.day, 1), 2)
        logger.info(f"Monthly average: {monthly_average}")

        # Highest Consumption (date and liters)
        logger.info("Querying highest consumption...")
        highest_consumption_query = db.query(
            ConsumptionEntry.date,
            ConsumptionEntry.liters_consumed
        ).filter(
            ConsumptionEntry.user_id == current_user.id
        ).order_by(
            ConsumptionEntry.liters_consumed.desc()
        ).first()

        highest_consumption = {
            "date": highest_consumption_query.date.strftime('%Y-%m-%d') if highest_consumption_query else None,
            "liters": highest_consumption_query.liters_consumed if highest_consumption_query else 0,
        }
        logger.info(f"Highest consumption: {highest_consumption}")

        # Weekly Trends
        logger.info("Calculating weekly trends...")
        weekly_trends = [
            {
                "name": (start_of_week + timedelta(days=i)).strftime("%A"),
                "liters": db.query(func.sum(ConsumptionEntry.liters_consumed)).filter(
                    ConsumptionEntry.date == (start_of_week + timedelta(days=i)),
                    ConsumptionEntry.user_id == current_user.id,
                ).scalar() or 0,
            }
            for i in range(7)
        ]
        logger.info(f"Weekly trends: {weekly_trends}")

        return {
            "todayConsumption": today_consumption,
            "weeklyConsumption": weekly_consumption,
            "monthlyAverage": monthly_average,
            "totalConsumption": total_consumption,
            "highestConsumption": highest_consumption,
            "weeklyTrends": weekly_trends,
        }
    except Exception as e:
        logger.error(f"Error fetching dashboard metrics: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to fetch dashboard metrics")

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
