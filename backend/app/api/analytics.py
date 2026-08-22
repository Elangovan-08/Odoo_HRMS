from datetime import date
from fastapi import APIRouter, Depends
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.attendance import Attendance
from app.models.time_off import TimeOff

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/summary")
async def get_analytics_summary(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    today = date.today()

    # Total employees
    emp_count_res = await db.execute(select(func.count(User.id)))
    total_employees = emp_count_res.scalar() or 0

    # Total wage sum
    wage_sum_res = await db.execute(select(func.sum(User.wage)))
    total_wage_bill = wage_sum_res.scalar() or 0.0

    # On leave today
    leave_count_res = await db.execute(
        select(func.count(func.distinct(TimeOff.employee_id))).where(
            TimeOff.status == "Approved",
            TimeOff.start_date <= today,
            TimeOff.end_date >= today
        )
    )
    on_leave_today = leave_count_res.scalar() or 0

    # Present today (checked in and not on leave)
    present_res = await db.execute(
        select(func.count(func.distinct(Attendance.employee_id))).where(
            Attendance.date == today,
            Attendance.check_in.isnot(None),
            Attendance.check_out.is_(None)
        )
    )
    present_today = present_res.scalar() or 0

    # Absent today
    absent_today = max(0, total_employees - present_today - on_leave_today)

    # Pending leave requests
    pending_leaves_res = await db.execute(
        select(func.count(TimeOff.id)).where(TimeOff.status == "Pending")
    )
    pending_leaves = pending_leaves_res.scalar() or 0

    return {
        "total_employees": total_employees,
        "present_today": present_today,
        "on_leave_today": on_leave_today,
        "absent_today": absent_today,
        "pending_leave_requests": pending_leaves,
        "total_monthly_payroll": round(total_wage_bill, 2),
    }
