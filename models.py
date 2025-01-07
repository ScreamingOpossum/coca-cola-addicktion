from sqlalchemy import Column, Integer, String, Float, Date, TIMESTAMP, func, ForeignKey
from sqlalchemy.orm import relationship, declarative_base

# Define Base
Base = declarative_base()

# ----------------------------
# Users Table
# ----------------------------
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    date_of_birth = Column(Date, nullable=False)
    monthly_goal = Column(Float, nullable=True)  # Liters

    # Timestamps
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    # Relationships
    consumption_entries = relationship("ConsumptionEntry", back_populates="user")
    spending_entries = relationship("SpendingEntry", back_populates="user")


# ----------------------------
# Purchase Locations Table
# ----------------------------
class PurchaseLocation(Base):
    __tablename__ = "purchase_locations"

    id = Column(Integer, primary_key=True, index=True)
    store_name = Column(String, nullable=False, unique=True)
    city = Column(String, nullable=False, default="Minsk")

    # Timestamps
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    # Relationships
    consumption_entries = relationship("ConsumptionEntry", back_populates="location")
    spending_entries = relationship("SpendingEntry", back_populates="location")


# ----------------------------
# Consumption Entries Table
# ----------------------------
class ConsumptionEntry(Base):
    __tablename__ = "consumption_entries"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    location_id = Column(Integer, ForeignKey("purchase_locations.id"), nullable=True)
    date = Column(Date, nullable=False)
    liters_consumed = Column(Float, nullable=False)

    # Timestamps
    created_at = Column(TIMESTAMP, server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="consumption_entries")
    location = relationship("PurchaseLocation", back_populates="consumption_entries")


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

    # Timestamps
    created_at = Column(TIMESTAMP, server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="spending_entries")
    location = relationship("PurchaseLocation", back_populates="spending_entries")
