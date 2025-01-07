from pydantic import BaseModel, Field
from datetime import date
from typing import Optional
from pydantic import BaseModel
from typing import Optional
from pydantic import BaseModel


# Token Schema
class Token(BaseModel):
    access_token: str
    token_type: str

# TokenData Schema
class TokenData(BaseModel):
    email: Optional[str] = None

# User Schema
class UserBase(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=50)
    last_name: str = Field(..., min_length=1, max_length=50)
    email: str = Field(..., pattern=r'^\S+@\S+\.\S+$')
    date_of_birth: date
    monthly_goal: Optional[float] = Field(None, gt=0)  # Liters should be positive


class UserCreate(UserBase):
    password: str = Field(..., min_length=8)


class UserResponse(UserBase):
    id: int
    created_at: date

    class Config:
        from_attributes = True


# Location Schema
class LocationBase(BaseModel):
    store_name: str = Field(..., max_length=100)
    city: str = Field(..., max_length=50)


class LocationCreate(LocationBase):
    pass


class LocationResponse(LocationBase):
    id: int

    class Config:
        from_attributes = True


# Consumption Entry Schema
class ConsumptionBase(BaseModel):
    date: date
    liters_consumed: float = Field(..., gt=0)


class ConsumptionCreate(ConsumptionBase):
    user_id: int
    location_id: Optional[int] = None


class ConsumptionResponse(ConsumptionBase):
    id: int

    class Config:
        from_attributes = True


# Spending Entry Schema
class SpendingBase(BaseModel):
    date: date
    amount_spent: float = Field(..., gt=0)


class SpendingCreate(SpendingBase):
    user_id: int
    location_id: Optional[int] = None


class SpendingResponse(SpendingBase):
    id: int

    class Config:
        from_attributes = True