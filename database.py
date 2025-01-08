from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import Base  # Import the Base class from models.py
from dotenv import load_dotenv
import os
import logging
from sqlalchemy.exc import OperationalError

# ------------------------
# Logging Setup
# ------------------------
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ------------------------
# Load Environment Variables
# ------------------------
load_dotenv()

# ------------------------
# Database Configuration
# ------------------------

# Fetch DATABASE_URL or fallback to default (useful for debugging/local setup)
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@localhost:5432/dbname")

# Log Database URL (without password for security)
safe_url = DATABASE_URL.replace(DATABASE_URL.split(':')[2].split('@')[0], "*****")
logger.info(f"Connecting to Database: {safe_url}")

# Create the SQLAlchemy engine
try:
    engine = create_engine(DATABASE_URL, echo=True)  # Set echo=True for query logging in debug mode
    logger.info("Database engine created successfully.")
except Exception as e:
    logger.error(f"Failed to create database engine: {e}")
    raise

# ------------------------
# Create Session
# ------------------------
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# ------------------------
# Test Connection
# ------------------------
def test_connection():
    try:
        with engine.connect() as conn:
            logger.info("Database connection test successful.")
    except OperationalError as e:
        logger.error(f"Database connection failed: {e}")
        raise

# ------------------------
# Create Tables
# ------------------------
try:
    logger.info("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables created successfully.")
except Exception as e:
    logger.error(f"Error during table creation: {e}")
    raise

# ------------------------
# Run Connection Test
# ------------------------
test_connection()
