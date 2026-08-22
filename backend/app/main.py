from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, status
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.core.database import engine, get_db
from app.api.users import router as users_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        async with engine.begin() as conn:
            await conn.execute(text("SELECT 1"))
        print(" Connected to MySQL database successfully.")
    except Exception as e:
        print(f" Database connection failed: {e}")
        raise e

    yield

    await engine.dispose()
    print(" MySQL connection pool closed.")


app = FastAPI(title=settings.PROJECT_NAME, lifespan=lifespan)
app.include_router(users_router)


@app.get("/health/db", status_code=status.HTTP_200_OK)
async def check_db_health(db: AsyncSession = Depends(get_db)):
    result = await db.execute(text("SELECT 1"))
    return {"database": "healthy", "result": result.scalar()}