from typing import List
from datetime import datetime, date
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.dependencies import get_current_user, get_current_admin
from app.models.user import User
from app.models.time_off import TimeOff
from app.models.attendance import Attendance
from app.schemas.time_off import TimeOffCreate, TimeOffResponse, TimeOffStatusUpdate

router = APIRouter(prefix="/time-off", tags=["time-off"])


@router.post("", response_model=TimeOffResponse, status_code=status.HTTP_201_CREATED)
async def create_time_off(
    req: TimeOffCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if req.end_date < req.start_date:
        raise HTTPException(status_code=400, detail="End date cannot be earlier than start date")

    # Calculate days count if not provided accurately
    delta_days = (req.end_date - req.start_date).days + 1
    days_count = float(delta_days) if req.days_count <= 0 else req.days_count

    new_leave = TimeOff(
        employee_id=current_user.id,
        leave_type=req.leave_type,
        start_date=req.start_date,
        end_date=req.end_date,
        days_count=days_count,
        reason=req.reason,
        status="Pending"
    )
    
    db.add(new_leave)
    await db.commit()
    await db.refresh(new_leave)

    resp = TimeOffResponse.model_validate(new_leave)
    resp.employee_name = f"{current_user.first_name} {current_user.last_name}"
    resp.employee_login_id = current_user.login_id
    return resp


@router.get("/my", response_model=List[TimeOffResponse])
async def get_my_time_off(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(TimeOff).where(TimeOff.employee_id == current_user.id).order_by(desc(TimeOff.created_at))
    res = await db.execute(stmt)
    leaves = res.scalars().all()

    response_list = []
    for l in leaves:
        resp = TimeOffResponse.model_validate(l)
        resp.employee_name = f"{current_user.first_name} {current_user.last_name}"
        resp.employee_login_id = current_user.login_id
        response_list.append(resp)

    return response_list


@router.get("/all", response_model=List[TimeOffResponse])
async def get_all_time_off(
    admin_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(TimeOff).options(selectinload(TimeOff.employee)).order_by(desc(TimeOff.created_at))
    res = await db.execute(stmt)
    leaves = res.scalars().all()

    response_list = []
    for l in leaves:
        resp = TimeOffResponse.model_validate(l)
        if l.employee:
            resp.employee_name = f"{l.employee.first_name} {l.employee.last_name}"
            resp.employee_login_id = l.employee.login_id
        response_list.append(resp)

    return response_list


@router.patch("/{id}/status", response_model=TimeOffResponse)
async def update_time_off_status(
    id: int,
    req: TimeOffStatusUpdate,
    admin_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(TimeOff).options(selectinload(TimeOff.employee)).where(TimeOff.id == id)
    res = await db.execute(stmt)
    leave = res.scalar_one_or_none()

    if not leave:
        raise HTTPException(status_code=404, detail="Time Off request not found")

    new_status = req.status.capitalize()
    if new_status not in ["Approved", "Rejected", "Pending"]:
        raise HTTPException(status_code=400, detail="Invalid status value")

    leave.status = new_status
    leave.approved_by_id = admin_user.id
    
    # If approved, update attendance record for leave dates to status "Leave"
    if new_status == "Approved":
        curr_date = leave.start_date
        while curr_date <= leave.end_date:
            att_stmt = select(Attendance).where(
                Attendance.employee_id == leave.employee_id,
                Attendance.date == curr_date
            )
            att_res = await db.execute(att_stmt)
            att = att_res.scalar_one_or_none()
            if att:
                att.status = "Leave"
            else:
                att = Attendance(
                    employee_id=leave.employee_id,
                    date=curr_date,
                    status="Leave",
                    notes=f"Approved {leave.leave_type}"
                )
                db.add(att)
            curr_date = curr_date.replace(day=curr_date.day + 1) if curr_date.day < 28 else date.fromordinal(curr_date.toordinal() + 1)

    await db.commit()
    await db.refresh(leave)

    resp = TimeOffResponse.model_validate(leave)
    if leave.employee:
        resp.employee_name = f"{leave.employee.first_name} {leave.employee.last_name}"
        resp.employee_login_id = leave.employee.login_id

    return resp
