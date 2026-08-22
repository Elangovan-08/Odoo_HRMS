from datetime import datetime
from typing import Optional, List
from sqlalchemy import String, Boolean, Integer, Float, DateTime, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    login_id: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    password: Mapped[str] = mapped_column(String(255), nullable=False)
    
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    role: Mapped[str] = mapped_column(String(50), default="employee", nullable=False)  # "admin" or "employee"
    
    is_verified: Mapped[bool] = mapped_column(Boolean, default=True)
    verification_token: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    is_first_login: Mapped[bool] = mapped_column(Boolean, default=True)
    
    joining_year: Mapped[int] = mapped_column(Integer, nullable=False, default=2026)
    joining_serial: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    
    department: Mapped[str] = mapped_column(String(100), default="General")
    job_title: Mapped[str] = mapped_column(String(100), default="Software Engineer")
    work_phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True, default="+91 9876543210")
    work_email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    
    # Editable by Employee:
    personal_address: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    personal_phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    profile_picture: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    
    # Payroll (Fixed wage):
    wage: Mapped[float] = mapped_column(Float, default=50000.0)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    date_of_join = 

    # Relationships
    attendances: Mapped[List["Attendance"]] = relationship("Attendance", back_populates="employee", cascade="all, delete-orphan")
    time_offs: Mapped[List["TimeOff"]] = relationship("TimeOff", back_populates="employee", foreign_keys="[TimeOff.employee_id]", cascade="all, delete-orphan")