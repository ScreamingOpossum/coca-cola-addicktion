from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    Date,
    TIMESTAMP,
    func,
    ForeignKey,
    Enum,
    CheckConstraint,
)
from sqlalchemy.orm import relationship, declarative_base
import enum
from datetime import date

# Define Base
Base = declarative_base()

# ----------------------------
# Users Table
# ----------------------------

# User Roles Enum
class RoleEnum(str, enum.Enum):
    admin = "admin"
    user = "user"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    date_of_birth = Column(Date, nullable=False)
    monthly_goal = Column(Float, nullable=True)  # Liters
    role = Column(Enum(RoleEnum), default=RoleEnum.user)  # Default role is "user"
    income = Column(Float, nullable=True)  # Optional Income field

    # Timestamps
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    # Relationships
    consumption_entries = relationship("ConsumptionEntry", back_populates="user")
    spending_entries = relationship("SpendingEntry", back_populates="user")


# ----------------------------
# Consumption Entries Table
# ----------------------------
class ConsumptionEntry(Base):
    __tablename__ = "consumption_entries"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    location_id = Column(Integer, ForeignKey("purchase_locations.id"), nullable=True)
    date = Column(Date, nullable=False, default=date.today)  # Default to today's date
    liters_consumed = Column(Float, nullable=False)
    notes = Column(String, nullable=True)  # Field for optional comments

    # Timestamps
    created_at = Column(TIMESTAMP, server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="consumption_entries")

    # Constraints
    __table_args__ = (
        CheckConstraint("liters_consumed > 0", name="check_liters_positive"),
    )

# ----------------------------
# Spending Entries Table
# ----------------------------
class SpendingEntry(Base):
    __tablename__ = "spending_entries"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    location_id = Column(Integer, ForeignKey("purchase_locations.id"), nullable=True)
    date = Column(Date, nullable=False)
    amount_spent = Column(Float, nullable=False)
    liters = Column(Float, nullable=False)
    store = Column(String, nullable=True)
    city = Column(String, nullable=True)
    notes = Column(String, nullable=True)

    # Timestamps
    created_at = Column(TIMESTAMP, server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="spending_entries")

    # Constraints
    __table_args__ = (
        CheckConstraint("amount_spent > 0", name="check_amount_positive"),
        CheckConstraint("liters > 0", name="check_liters_positive"),
    )
