from typing import List, Optional
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import hash_password, generate_temp_password
from app.core.dependencies import get_current_user, get_current_admin
from app.models.user import User
from app.models.attendance import Attendance
from app.models.time_off import TimeOff
from app.schemas.user import UserCreate, UserResponse, UserCreatedResponse, UserUpdateAdmin, UserUpdateSelf

router = APIRouter(prefix="/employees", tags=["employees"])


async def generate_login_id(db: AsyncSession, first_name: str, last_name: str, joining_year: int) -> tuple[str, int]:
    fn_part = (first_name.strip()[:2] if len(first_name.strip()) >= 2 else first_name.strip() + "X").upper()
    ln_part = (last_name.strip()[:2] if len(last_name.strip()) >= 2 else last_name.strip() + "X").upper()

    query = select(func.max(User.joining_serial)).where(User.joining_year == joining_year)
    result = await db.execute(query)
    max_serial = result.scalar()

    serial = (max_serial or 0) + 1
    serial_str = f"{serial:04d}"

    login_id = f"OI{fn_part}{ln_part}{joining_year}{serial_str}"
    return login_id, serial


async def compute_employee_status(db: AsyncSession, user_id: int) -> str:
    today = date.today()
    
    # 1. Airplane icon: approved leave today
    leave_query = select(TimeOff).where(
        TimeOff.employee_id == user_id,
        TimeOff.status == "Approved",
        TimeOff.start_date <= today,
        TimeOff.end_date >= today
    )
    leave_res = await db.execute(leave_query)
    if leave_res.scalar_one_or_none():
        return "airplane"
        
    # 2. Green dot: checked in today & not checked out
    att_query = select(Attendance).where(
        Attendance.employee_id == user_id,
        Attendance.date == today,
        Attendance.check_in.isnot(None),
        Attendance.check_out.is_(None)
    )
    att_res = await db.execute(att_query)
    if att_res.scalar_one_or_none():
        return "green"
        
    # 3. Yellow dot: absent / not checked in
    return "yellow"


@router.get("", response_model=List[UserResponse])
async def get_all_employees(
    department: Optional[str] = None,
    search: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = select(User)
    
    if department:
        query = query.where(User.department == department)
        
    if search:
        pattern = f"%{search}%"
        query = query.where(
            or_(
                User.first_name.ilike(pattern),
                User.last_name.ilike(pattern),
                User.login_id.ilike(pattern),
                User.email.ilike(pattern),
                User.job_title.ilike(pattern),
                User.department.ilike(pattern)
            )
        )
        
    result = await db.execute(query)
    employees = result.scalars().all()
    
    response_list = []
    for emp in employees:
        status_val = await compute_employee_status(db, emp.id)
        resp = UserResponse.model_validate(emp)
        resp.work_status = status_val
        response_list.append(resp)
        
    return response_list


@router.post("", response_model=UserCreatedResponse, status_code=status.HTTP_201_CREATED)
async def create_employee(
    emp_data: UserCreate,
    admin_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    # Check duplicate email
    existing_email = await db.execute(select(User).where(User.email == emp_data.email.lower()))
    if existing_email.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Employee with this email already exists")

    login_id, serial = await generate_login_id(db, emp_data.first_name, emp_data.last_name, emp_data.joining_year)
    temp_password = generate_temp_password()
    hashed_pwd = hash_password(temp_password)

    new_emp = User(
        login_id=login_id,
        email=emp_data.email.lower(),
        password=hashed_pwd,
        first_name=emp_data.first_name.strip(),
        last_name=emp_data.last_name.strip(),
        role=emp_data.role.lower(),
        is_verified=True,
        is_first_login=True,
        joining_year=emp_data.joining_year,
        joining_serial=serial,
        department=emp_data.department,
        job_title=emp_data.job_title,
        work_phone=emp_data.work_phone,
        work_email=emp_data.work_email or emp_data.email.lower(),
        wage=emp_data.wage,
    )
    
    db.add(new_emp)
    await db.commit()
    await db.refresh(new_emp)

    work_status = await compute_employee_status(db, new_emp.id)
    user_resp = UserResponse.model_validate(new_emp)
    user_resp.work_status = work_status

    return UserCreatedResponse(
        user=user_resp,
        temp_password=temp_password,
        login_id=login_id
    )


@router.get("/{id}", response_model=UserResponse)
async def get_employee_by_id(
    id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(select(User).where(User.id == id))
    emp = res.scalar_one_or_none()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
        
    work_status = await compute_employee_status(db, emp.id)
    resp = UserResponse.model_validate(emp)
    resp.work_status = work_status
    return resp


@router.patch("/{id}", response_model=UserResponse)
async def update_employee(
    id: int,
    update_data: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(select(User).where(User.id == id))
    emp = res.scalar_one_or_none()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    is_admin = current_user.role.lower() in ["admin", "hr officer", "hr"]
    is_self = (current_user.id == id)

    if not is_admin and not is_self:
        raise HTTPException(status_code=403, detail="Not authorized to update this employee profile")

    if is_admin:
        # Full update privileges
        for field, value in update_data.items():
            if hasattr(emp, field) and value is not None and field not in ["id", "login_id"]:
                setattr(emp, field, value)
    else:
        # Restricted update privileges for self (address, phone, avatar)
        allowed_fields = {"personal_address", "personal_phone", "profile_picture"}
        for field, value in update_data.items():
            if field in allowed_fields and value is not None:
                setattr(emp, field, value)

    await db.commit()
    await db.refresh(emp)

    work_status = await compute_employee_status(db, emp.id)
    resp = UserResponse.model_validate(emp)
    resp.work_status = work_status
    return resp
