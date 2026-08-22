from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import date

from app.core.database import get_db
from app.core.security import verify_password, hash_password, create_access_token
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.attendance import Attendance
from app.models.time_off import TimeOff
from app.schemas.user import LoginRequest, TokenResponse, UserResponse, PasswordChange

router = APIRouter(prefix="/auth", tags=["auth"])


async def compute_employee_status(db: AsyncSession, user_id: int) -> str:
    today = date.today()
    
    # 1. Check if on approved leave today (Airplane icon)
    leave_query = select(TimeOff).where(
        TimeOff.employee_id == user_id,
        TimeOff.status == "Approved",
        TimeOff.start_date <= today,
        TimeOff.end_date >= today
    )
    leave_res = await db.execute(leave_query)
    if leave_res.scalar_one_or_none():
        return "airplane"
        
    # 2. Check if checked in today (Green dot)
    att_query = select(Attendance).where(
        Attendance.employee_id == user_id,
        Attendance.date == today,
        Attendance.check_in.isnot(None),
        Attendance.check_out.is_(None)
    )
    att_res = await db.execute(att_query)
    if att_res.scalar_one_or_none():
        return "green"
        
    # 3. Otherwise yellow dot (Absent / Not checked in)
    return "yellow"


@router.post("/login", response_model=TokenResponse)
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    # Match login_id or email
    stmt = select(User).where(
        or_(
            User.login_id == req.login_id_or_email.strip(),
            User.email == req.login_id_or_email.strip().lower()
        )
    )
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user or not verify_password(req.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Login ID/Email or Password",
        )

    token = create_access_token(subject=str(user.id))
    work_status = await compute_employee_status(db, user.id)
    
    user_resp = UserResponse.model_validate(user)
    user_resp.work_status = work_status

    return TokenResponse(access_token=token, user=user_resp)


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    work_status = await compute_employee_status(db, current_user.id)
    user_resp = UserResponse.model_validate(current_user)
    user_resp.work_status = work_status
    return user_resp


@router.post("/change-password")
async def change_password(
    req: PasswordChange,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if not verify_password(req.current_password, current_user.password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect",
        )
        
    current_user.password = hash_password(req.new_password)
    current_user.is_first_login = False
    await db.commit()
    return {"message": "Password changed successfully"}


@router.post("/verify-email")
async def verify_email(token: str, db: AsyncSession = Depends(get_db)):
    stmt = select(User).where(User.verification_token == token)
    res = await db.execute(stmt)
    user = res.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=400, detail="Invalid verification token")
        
    user.is_verified = True
    user.verification_token = None
    await db.commit()
    return {"message": "Email verified successfully"}
