from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user, get_current_admin
from app.models.user import User
from app.schemas.payroll import SalaryBreakdownResponse, compute_salary_breakdown

router = APIRouter(prefix="/payroll", tags=["payroll"])


@router.get("/calculate", response_model=SalaryBreakdownResponse)
async def preview_salary_calculation(wage: float, current_user: User = Depends(get_current_user)):
    return compute_salary_breakdown(wage)


@router.get("/employee/{employee_id}", response_model=SalaryBreakdownResponse)
async def get_employee_payroll(
    employee_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    is_admin = current_user.role.lower() in ["admin", "hr officer", "hr"]
    is_self = (current_user.id == employee_id)
    
    if not is_admin and not is_self:
        raise HTTPException(status_code=403, detail="Not authorized to view this employee's salary breakdown")
        
    res = await db.execute(select(User).where(User.id == employee_id))
    emp = res.scalar_one_or_none()
    
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
        
    return compute_salary_breakdown(emp.wage)
