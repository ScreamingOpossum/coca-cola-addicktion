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


class UserCreate(UserBase):
    password: str = Field(..., min_length=8)


class UserResponse(UserBase):
    id: int
    role: RoleEnum
    created_at: Optional[datetime]

    class Config:
        populate_by_name = True
        from_attributes = True
        json_encoders = {datetime: lambda v: v.date().isoformat()}


class UserProfileResponse(BaseModel):
    id: int
    first_name: str
    last_name: str
    email: str
    date_of_birth: date
    monthly_goal: float
    current_month_consumption: float

class UserProfileUpdate(BaseModel):
    first_name: Optional[str]
    last_name: Optional[str]
    monthly_goal: Optional[float]


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
    pass


class ConsumptionResponse(ConsumptionBase):
    id: int


class MonthlyConsumptionResponse(BaseModel):
    month: str
    total_consumption: float
    average_daily_consumption: float
    highest_consumption: Optional[dict]


class MonthlyConsumptionHistoryResponse(BaseModel):
    data: List[MonthlyConsumptionResponse]


# --------------------------
# Spending Schemas
# --------------------------

class SpendingBase(BaseModel):
    date: date
    amount_spent: float = Field(..., alias="amountSpent", gt=0)
    liters: float = Field(..., alias="liters", gt=0)
    store: Optional[str] = Field(None, alias="store", max_length=100)
    city: Optional[str] = Field(None, alias="city", max_length=50)
    notes: Optional[str] = Field(None, alias="notes", max_length=255)

    class Config:
        populate_by_name = True
        from_attributes = True


class SpendingCreate(SpendingBase):
    pass


class SpendingResponse(SpendingBase):
    id: int
