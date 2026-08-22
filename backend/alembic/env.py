import os
from logging.config import fileConfig
from dotenv import load_dotenv
from sqlalchemy import engine_from_config, pool
from alembic import context

# 1. Load variables from .env
load_dotenv()

# Build the connection string
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "3306")
DB_NAME = os.getenv("DB_NAME")

DATABASE_URL = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

# Alembic Config object
config = context.config

# 2. Overwrite the sqlalchemy.url from alembic.ini with the dynamic URL
config.set_main_option("sqlalchemy.url", DATABASE_URL)

# Interpret the config file for Python logging
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# 3. Add your model's MetaData object for autogenerate support
# from app.database import Base  # Adjust to your project's Base import
# import app.models             # Ensure models are imported

# target_metadata = Base.metadata

# ... rest of the default env.py file (run_migrations_offline, run_migrations_online)