from pydantic import BaseModel, Field, EmailStr
from datetime import date, datetime
from typing import Optional, List
from enum import Enum


# --------------------------
# Token Schemas
# --------------------------

class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    email: Optional[str] = None


# --------------------------
# Role Enum
# --------------------------

class RoleEnum(str, Enum):
    user = "user"
    admin = "admin"


# --------------------------
# User Schemas
# --------------------------

class UserBase(BaseModel):
    first_name: str = Field(..., alias="firstName", min_length=1, max_length=50)
    last_name: str = Field(..., alias="lastName", min_length=1, max_length=50)
    email: EmailStr
    date_of_birth: date = Field(..., alias="dateOfBirth")
    monthly_goal: Optional[float] = Field(None, alias="monthlyGoal", gt=0)

    class Config:
        populate_by_name = True
        from_attributes = True


class UserCreate(BaseModel):
    first_name: str = Field(..., alias="firstName", min_length=1, max_length=50)
    last_name: str = Field(..., alias="lastName", min_length=1, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=8)
    date_of_birth: date = Field(..., alias="dateOfBirth")
    monthly_goal: Optional[float] = Field(None, alias="monthlyGoal", gt=0)

    class Config:
        populate_by_name = True
        from_attributes = True


class UserResponse(UserBase):
    id: int
    role: RoleEnum
    created_at: Optional[datetime]

    class Config:
        populate_by_name = True
        from_attributes = True
        json_encoders = {datetime: lambda v: v.date().isoformat()}


# --------------------------
# Location Schemas
# --------------------------

class LocationBase(BaseModel):
    store_name: str = Field(..., alias="storeName", max_length=100)
    city: str = Field(..., max_length=50)

    class Config:
        populate_by_name = True
        from_attributes = True


class LocationCreate(LocationBase):
    pass


class LocationResponse(LocationBase):
    id: int

    class Config:
        populate_by_name = True
        from_attributes = True


# --------------------------
# Consumption Schemas
# --------------------------

class ConsumptionBase(BaseModel):
    date: date
    liters_consumed: float = Field(..., alias="litersConsumed", gt=0)
    notes: Optional[str] = Field(None, max_length=255)

    class Config:
        populate_by_name = True
        from_attributes = True


class ConsumptionCreate(ConsumptionBase):
    pass  # Removed location_id field

    class Config:
        populate_by_name = True
        from_attributes = True


class ConsumptionResponse(ConsumptionBase):
    id: int

    class Config:
        populate_by_name = True
        from_attributes = True


class MonthlyConsumptionResponse(BaseModel):
    month: str
    total_consumption: float
    average_daily_consumption: float
    highest_consumption: Optional[dict]

    class Config:
        populate_by_name = True
        from_attributes = True


class MonthlyConsumptionHistoryResponse(BaseModel):
    data: List[MonthlyConsumptionResponse]

    class Config:
        populate_by_name = True
        from_attributes = True


# --------------------------
# Spending Schemas
# --------------------------

class SpendingBase(BaseModel):
    date: date
    amount_spent: float = Field(..., alias="amountSpent", gt=0)

    class Config:
        populate_by_name = True
        from_attributes = True


class SpendingCreate(SpendingBase):
    location_id: Optional[int] = Field(None, alias="locationId")

    class Config:
        populate_by_name = True
        from_attributes = True


class SpendingResponse(SpendingBase):
    id: int
    location_id: Optional[int] = Field(None, alias="locationId")

    class Config:
        populate_by_name = True
        from_attributes = True
