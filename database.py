from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import Base  # Import the Base class from models.py
from dotenv import load_dotenv
import os

# Load environment variables from .env
load_dotenv()

# Database Configuration
DATABASE_URL = os.getenv("DATABASE_URL")  # Read from .env file

# Create the SQLAlchemy engine
engine = create_engine(DATABASE_URL)

# Create a SessionLocal class to handle sessions
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create Database Tables
Base.metadata.create_all(bind=engine)