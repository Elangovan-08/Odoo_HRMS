from datetime import datetime, date
from typing import Optional
from pydantic import BaseModel, Field


class TimeOffCreate(BaseModel):
    leave_type: str  # Paid Time Off, Sick Leave, Unpaid Leaves
    start_date: date
    end_date: date
    days_count: float = Field(default=1.0, gt=0)
    reason: Optional[str] = None


class TimeOffStatusUpdate(BaseModel):
    status: str  # Approved, Rejected


class TimeOffResponse(BaseModel):
    id: int
    employee_id: int
    leave_type: str
    start_date: date
    end_date: date
    days_count: float
    reason: Optional[str] = None
    status: str
    approved_by_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    
    # Optional employee details preview
    employee_name: Optional[str] = None
    employee_login_id: Optional[str] = None

    class Config:
        from_attributes = True
