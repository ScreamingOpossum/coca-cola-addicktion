from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date, timedelta
from typing import List
from dependencies import get_db
from models import ConsumptionEntry, SpendingEntry, User

router = APIRouter()

# -------------------------
# 1. Daily Trends
# -------------------------
@router.get("/daily-trends")
def get_daily_trends(user_id: int, db: Session = Depends(get_db)):
    try:
        trends = (
            db.query(ConsumptionEntry.date, func.sum(ConsumptionEntry.liters_consumed))
            .filter(ConsumptionEntry.user_id == user_id)
            .group_by(ConsumptionEntry.date)
            .order_by(ConsumptionEntry.date)
            .all()
        )

        return {"trends": [{"date": str(trend[0]), "liters": round(trend[1] or 0, 2)} for trend in trends]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching daily trends: {str(e)}")


# -------------------------
# 2. Compare Selected Months
# -------------------------
@router.get("/compare-months")
def compare_months(
    user_id: int,
    # Add alias="months[]" so FastAPI accepts ?months[]=val1&months[]=val2
    months: List[str] = Query(..., alias="months[]", description="List of months in YYYY-MM format"),
    db: Session = Depends(get_db)
):
    if not months:
        raise HTTPException(status_code=400, detail="No months provided for comparison")

    results = []
    for month in months:
        try:
            month_start = date.fromisoformat(month + "-01")
            # calculate the last day of that month
            month_end = (month_start.replace(day=28) + timedelta(days=4)).replace(day=1) - timedelta(days=1)

            consumption = (
                db.query(func.coalesce(func.sum(ConsumptionEntry.liters_consumed), 0))
                .filter(ConsumptionEntry.user_id == user_id, ConsumptionEntry.date.between(month_start, month_end))
                .scalar()
            )

            spending = (
                db.query(func.coalesce(func.sum(SpendingEntry.amount_spent), 0))
                .filter(SpendingEntry.user_id == user_id, SpendingEntry.date.between(month_start, month_end))
                .scalar()
            )

            results.append({
                "month": month,
                "consumption": round(consumption, 2),
                "spending": round(spending, 2)
            })
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error comparing months: {str(e)}")

    return {"comparison": results}

# -------------------------
# 3. Weekly Overview
# -------------------------
@router.get("/weekly-overview")
def weekly_overview(user_id: int, db: Session = Depends(get_db)):
    try:
        today = date.today()
        start_of_week = today - timedelta(days=today.weekday())

        weekly_data = [
            {
                "date": str(start_of_week + timedelta(days=i)),
                "liters": round((
                    db.query(func.coalesce(func.sum(ConsumptionEntry.liters_consumed), 0))
                    .filter(ConsumptionEntry.user_id == user_id, ConsumptionEntry.date == (start_of_week + timedelta(days=i)))
                    .scalar()
                ), 2),
                "spending": round((
                    db.query(func.coalesce(func.sum(SpendingEntry.amount_spent), 0))
                    .filter(SpendingEntry.user_id == user_id, SpendingEntry.date == (start_of_week + timedelta(days=i)))
                    .scalar()
                ), 2),
            }
            for i in range(7)
        ]

        return {"weekly_overview": weekly_data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching weekly overview: {str(e)}")


# -------------------------
# 4. Monthly Trends
# -------------------------
@router.get("/monthly-trends")
def get_monthly_trends(user_id: int, month: str = None, db: Session = Depends(get_db)):
    try:
        today = date.today()
        month_start = date.fromisoformat(month + "-01") if month else today.replace(day=1)
        month_end = (month_start.replace(day=28) + timedelta(days=4)).replace(day=1) - timedelta(days=1)

        trends = (
            db.query(ConsumptionEntry.date, func.sum(ConsumptionEntry.liters_consumed))
            .filter(ConsumptionEntry.user_id == user_id, ConsumptionEntry.date.between(month_start, month_end))
            .group_by(ConsumptionEntry.date)
            .order_by(ConsumptionEntry.date)
            .all()
        )

        return {
            "daily_trends": [{"date": str(trend[0]), "liters": round(trend[1] or 0, 2)} for trend in trends]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching monthly trends: {str(e)}")


# -------------------------
# 5. Spending Percentage
# -------------------------
@router.get("/spending-percentage")
def spending_percentage(user_id: int, db: Session = Depends(get_db)):
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        income = user.income or 1  # Avoid division by zero
        total_spent = (
            db.query(func.coalesce(func.sum(SpendingEntry.amount_spent), 0))
            .filter(SpendingEntry.user_id == user_id)
            .scalar()
        )

        percentage = (total_spent / income) * 100
        return {"income": income, "total_spent": round(total_spent, 2), "spending_percentage": round(percentage, 2)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calculating spending percentage: {str(e)}")


# -------------------------
# 6. Annual Overview
# -------------------------
@router.get("/annual-overview")
def annual_overview(user_id: int, db: Session = Depends(get_db)):
    try:
        year = date.today().year

        data = (
            db.query(func.date_trunc('month', ConsumptionEntry.date),
                     func.sum(ConsumptionEntry.liters_consumed),
                     func.sum(SpendingEntry.amount_spent))
            .filter(ConsumptionEntry.user_id == user_id, func.extract('year', ConsumptionEntry.date) == year)
            .group_by(func.date_trunc('month', ConsumptionEntry.date))
            .order_by(func.date_trunc('month', ConsumptionEntry.date))
            .all()
        )

        return {
            "year": year,
            "monthly_data": [
                {"month": str(entry[0]), "liters": round(entry[1] or 0, 2), "spending": round(entry[2] or 0, 2)}
                for entry in data
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching annual overview: {str(e)}")


# -------------------------
# 7. Milestones
# -------------------------
@router.get("/milestones")
def get_milestones(user_id: int, db: Session = Depends(get_db)):
    try:
        total_consumption = (
            db.query(func.coalesce(func.sum(ConsumptionEntry.liters_consumed), 0))
            .filter(ConsumptionEntry.user_id == user_id)
            .scalar()
        )

        milestones = {
            "5L": total_consumption >= 5,
            "10L": total_consumption >= 10,
            "50L": total_consumption >= 50,
            "100L": total_consumption >= 100,
            "500L": total_consumption >= 500,
        }

        return {"total_consumption": round(total_consumption, 2), "milestones_reached": milestones}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching milestones: {str(e)}")


# -------------------------
# 8. Top Spending Days
# -------------------------
@router.get("/top-days")
def get_top_days(user_id: int, type: str = "spending", db: Session = Depends(get_db)):
    try:
        table = SpendingEntry if type == "spending" else ConsumptionEntry
        column = table.amount_spent if type == "spending" else table.liters_consumed

        top_days = (
            db.query(table.date, func.sum(column))
            .filter(table.user_id == user_id)
            .group_by(table.date)
            .order_by(func.sum(column).desc())
            .limit(5)
            .all()
        )

        return {"top_days": [{"date": str(day[0]), "value": round(day[1] or 0, 2)} for day in top_days]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching top days: {str(e)}")


# -------------------------
# 9. Average Daily Consumption (NEW METRIC)
# -------------------------
@router.get("/average-daily-consumption")
def get_average_daily_consumption(user_id: int, db: Session = Depends(get_db)):
    try:
        data = (
            db.query(func.avg(ConsumptionEntry.liters_consumed))
            .filter(ConsumptionEntry.user_id == user_id)
            .scalar()
        )

        return {"average_daily_consumption": round(data or 0, 2)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching average daily consumption: {str(e)}")
