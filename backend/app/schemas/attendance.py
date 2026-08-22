from datetime import datetime, date
from typing import Optional
from pydantic import BaseModel


class AttendanceCheckInRequest(BaseModel):
    notes: Optional[str] = None


class AttendanceResponse(BaseModel):
    id: int
    employee_id: int
    date: date
    check_in: Optional[datetime] = None
    check_out: Optional[datetime] = None
    total_hours: float
    status: str  # Present, Absent, Half-day, Leave
    notes: Optional[str] = None

    class Config:
        from_attributes = True


class AttendanceStatusSummary(BaseModel):
    is_checked_in: bool
    current_attendance: Optional[AttendanceResponse] = None
    today_status: str  # "green", "airplane", "yellow"
