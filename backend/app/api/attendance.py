from typing import List, Optional
from datetime import datetime, date
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user, get_current_admin
from app.models.user import User
from app.models.attendance import Attendance
from app.models.time_off import TimeOff
from app.schemas.attendance import AttendanceResponse, AttendanceCheckInRequest, AttendanceStatusSummary

router = APIRouter(prefix="/attendance", tags=["attendance"])


@router.get("/status", response_model=AttendanceStatusSummary)
async def get_attendance_status(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    today = date.today()
    
    # Check if leave is approved today
    leave_stmt = select(TimeOff).where(
        TimeOff.employee_id == current_user.id,
        TimeOff.status == "Approved",
        TimeOff.start_date <= today,
        TimeOff.end_date >= today
    )
    leave_res = await db.execute(leave_stmt)
    is_on_leave = leave_res.scalar_one_or_none() is not None
    
    att_stmt = select(Attendance).where(
        Attendance.employee_id == current_user.id,
        Attendance.date == today
    )
    att_res = await db.execute(att_stmt)
    att_record = att_res.scalar_one_or_none()
    
    is_checked_in = (att_record is not None and att_record.check_in is not None and att_record.check_out is None)
    
    if is_on_leave:
        today_status = "airplane"
    elif is_checked_in:
        today_status = "green"
    else:
        today_status = "yellow"
        
    return AttendanceStatusSummary(
        is_checked_in=is_checked_in,
        current_attendance=AttendanceResponse.model_validate(att_record) if att_record else None,
        today_status=today_status
    )


@router.post("/check-in", response_model=AttendanceResponse)
async def check_in(
    req: Optional[AttendanceCheckInRequest] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    today = date.today()
    now = datetime.utcnow()
    
    att_stmt = select(Attendance).where(
        Attendance.employee_id == current_user.id,
        Attendance.date == today
    )
    att_res = await db.execute(att_stmt)
    att_record = att_res.scalar_one_or_none()
    
    if att_record:
        if att_record.check_in is not None and att_record.check_out is None:
            raise HTTPException(status_code=400, detail="Already checked in today")
        att_record.check_in = now
        att_record.check_out = None
        att_record.status = "Present"
        if req and req.notes:
            att_record.notes = req.notes
    else:
        att_record = Attendance(
            employee_id=current_user.id,
            date=today,
            check_in=now,
            status="Present",
            notes=req.notes if req else None
        )
        db.add(att_record)
        
    await db.commit()
    await db.refresh(att_record)
    return AttendanceResponse.model_validate(att_record)


@router.post("/check-out", response_model=AttendanceResponse)
async def check_out(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    today = date.today()
    now = datetime.utcnow()
    
    att_stmt = select(Attendance).where(
        Attendance.employee_id == current_user.id,
        Attendance.date == today
    )
    att_res = await db.execute(att_stmt)
    att_record = att_res.scalar_one_or_none()
    
    if not att_record or att_record.check_in is None or att_record.check_out is not None:
        raise HTTPException(status_code=400, detail="Cannot check out without an active check-in")
        
    att_record.check_out = now
    elapsed_seconds = (now - att_record.check_in).total_seconds()
    total_hours = round(elapsed_seconds / 3600.0, 2)
    att_record.total_hours = total_hours
    
    if total_hours < 4.0:
        att_record.status = "Half-day"
    else:
        att_record.status = "Present"
        
    await db.commit()
    await db.refresh(att_record)
    return AttendanceResponse.model_validate(att_record)


@router.get("/my", response_model=List[AttendanceResponse])
async def get_my_attendance(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Attendance).where(Attendance.employee_id == current_user.id).order_by(desc(Attendance.date))
    res = await db.execute(stmt)
    records = res.scalars().all()
    return [AttendanceResponse.model_validate(r) for r in records]


@router.get("/all", response_model=List[AttendanceResponse])
async def get_all_attendance(
    admin_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Attendance).order_by(desc(Attendance.date))
    res = await db.execute(stmt)
    records = res.scalars().all()
    return [AttendanceResponse.model_validate(r) for r in records]
