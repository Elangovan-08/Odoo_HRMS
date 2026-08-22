import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import engine, get_db, Base, AsyncSessionLocal
from app.core.security import hash_password

from app.models.user import User
from app.models.attendance import Attendance
from app.models.time_off import TimeOff

from app.api.auth import router as auth_router
from app.api.employees import router as employees_router
from app.api.attendance import router as attendance_router
from app.api.time_off import router as time_off_router
from app.api.payroll import router as payroll_router
from app.api.analytics import router as analytics_router
from app.api.users import router as users_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("dayflow.main")


async def init_db_and_seed():
    try:
        async with engine.begin() as conn:
            # Check if existing users table is missing new fields (e.g. login_id)
            try:
                res = await conn.execute(text("SHOW COLUMNS FROM users LIKE 'login_id'"))
                row = res.fetchone()
                if not row:
                    logger.info("Migrating database tables to updated Dayflow schema...")
                    await conn.execute(text("DROP TABLE IF EXISTS attendances"))
                    await conn.execute(text("DROP TABLE IF EXISTS time_offs"))
                    await conn.execute(text("DROP TABLE IF EXISTS users"))
            except Exception:
                pass
            
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Database tables initialized successfully.")
    except Exception as e:
        logger.warning(f"Database initialization warning: {e}")

    # Seed default Admin and sample data if users table is empty
    try:
        async with AsyncSessionLocal() as session:
            res = await session.execute(select(User))
            existing_users = res.scalars().all()
            
            if not existing_users:
                logger.info("Seeding initial Admin and sample workforce data...")
                
                # Admin User
                admin_user = User(
                    login_id="OIADMI20260001",
                    email="admin@dayflow.com",
                    password=hash_password("admin123"),
                    first_name="Admin",
                    last_name="Officer",
                    role="admin",
                    is_verified=True,
                    is_first_login=False,
                    joining_year=2026,
                    joining_serial=1,
                    department="Human Resources",
                    job_title="HR Officer / Admin",
                    work_phone="+91 9876543210",
                    work_email="admin@dayflow.com",
                    wage=85000.0
                )
                
                # Sample Employee 1
                emp1 = User(
                    login_id="OIJODO20260002",
                    email="john.doe@dayflow.com",
                    password=hash_password("employee123"),
                    first_name="John",
                    last_name="Doe",
                    role="employee",
                    is_verified=True,
                    is_first_login=True,
                    joining_year=2026,
                    joining_serial=2,
                    department="Engineering",
                    job_title="Senior Frontend Developer",
                    work_phone="+91 9123456789",
                    work_email="john.doe@dayflow.com",
                    personal_address="123 Tech Park Road, Bengaluru, KA",
                    personal_phone="+91 9876500001",
                    profile_picture="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
                    wage=60000.0
                )
                
                # Sample Employee 2
                emp2 = User(
                    login_id="OISMSM20260003",
                    email="sarah.smith@dayflow.com",
                    password=hash_password("employee123"),
                    first_name="Sarah",
                    last_name="Smith",
                    role="employee",
                    is_verified=True,
                    is_first_login=False,
                    joining_year=2026,
                    joining_serial=3,
                    department="Design",
                    job_title="Lead UI/UX Designer",
                    work_phone="+91 9123456790",
                    work_email="sarah.smith@dayflow.com",
                    personal_address="45 Creative Hub, Mumbai, MH",
                    personal_phone="+91 9876500002",
                    profile_picture="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
                    wage=55000.0
                )
                
                session.add_all([admin_user, emp1, emp2])
                await session.commit()
                logger.info("Default seed data created successfully.")
    except Exception as e:
        logger.error(f"Error seeding database: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db_and_seed()
    yield
    await engine.dispose()
    logger.info("Database engine disposed.")


app = FastAPI(
    title="Dayflow HRMS API",
    description="Backend API for Dayflow Human Resource Management System",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth_router, prefix="/api")
app.include_router(employees_router, prefix="/api")
app.include_router(attendance_router, prefix="/api")
app.include_router(time_off_router, prefix="/api")
app.include_router(payroll_router, prefix="/api")
app.include_router(analytics_router, prefix="/api")
app.include_router(users_router)


@app.get("/health/db", status_code=status.HTTP_200_OK)
async def check_db_health(db: AsyncSession = Depends(get_db)):
    result = await db.execute(text("SELECT 1"))
    return {"database": "healthy", "result": result.scalar()}