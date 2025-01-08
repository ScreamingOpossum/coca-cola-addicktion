from pydantic import BaseModel, Field, EmailStr, validator
from datetime import date, datetime
from typing import Optional
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
    first_name: str = Field(..., alias="firstName", min_length=1, max_length=50)  # Aliased for camelCase
    last_name: str = Field(..., alias="lastName", min_length=1, max_length=50)
    email: EmailStr  # Validates email format
    date_of_birth: date = Field(..., alias="dateOfBirth")  # Aliased for camelCase
    monthly_goal: Optional[float] = Field(None, alias="monthlyGoal", gt=0)  # Positive float only

    class Config:
        populate_by_name = True  # Use camelCase for JSON serialization
        from_attributes = True  # ORM compatibility


class UserCreate(UserBase):
    password: str = Field(..., min_length=8)  # At least 8 characters


class UserResponse(UserBase):
    id: int
    role: RoleEnum  # Read-only role field
    created_at: Optional[date]  # Ensure backend provides this value in date format

    # Validator to handle datetime to date conversion
    @validator("created_at", pre=True, always=True)
    def validate_created_at(cls, value):
        if isinstance(value, datetime):
            return value.date()  # Convert datetime to date
        return value

    class Config:
        populate_by_name = True
        from_attributes = True


# --------------------------
# Location Schemas
# --------------------------

class LocationBase(BaseModel):
    store_name: str = Field(..., alias="storeName", max_length=100)  # Aliased for camelCase
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
    liters_consumed: float = Field(..., alias="litersConsumed", gt=0)  # Aliased for camelCase

    class Config:
        populate_by_name = True
        from_attributes = True


class ConsumptionCreate(ConsumptionBase):
    user_id: int = Field(..., alias="userId")  # Aliased for camelCase
    location_id: Optional[int] = Field(None, alias="locationId")

    class Config:
        populate_by_name = True
        from_attributes = True


class ConsumptionResponse(ConsumptionBase):
    id: int

    class Config:
        populate_by_name = True
        from_attributes = True


# --------------------------
# Spending Schemas
# --------------------------

class SpendingBase(BaseModel):
    date: date
    amount_spent: float = Field(..., alias="amountSpent", gt=0)  # Aliased for camelCase

    class Config:
        populate_by_name = True
        from_attributes = True


class SpendingCreate(SpendingBase):
    user_id: int = Field(..., alias="userId")  # Aliased for camelCase
    location_id: Optional[int] = Field(None, alias="locationId")

    class Config:
        populate_by_name = True
        from_attributes = True


class SpendingResponse(SpendingBase):
    id: int

    class Config:
        populate_by_name = True
        from_attributes = True
