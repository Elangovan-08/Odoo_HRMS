from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field


class UserBase(BaseModel):
    email: EmailStr
    first_name: str
    last_name: str
    department: str = "General"
    job_title: str = "Employee"
    work_phone: Optional[str] = "+91 9876543210"
    work_email: Optional[EmailStr] = None


class UserCreate(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    role: str = "employee"  # admin or employee
    joining_year: int = 2026
    department: str = "Engineering"
    job_title: str = "Software Engineer"
    work_phone: Optional[str] = "+91 9876543210"
    work_email: Optional[EmailStr] = None
    wage: float = 50000.0


class UserUpdateAdmin(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[str] = None
    department: Optional[str] = None
    job_title: Optional[str] = None
    work_phone: Optional[str] = None
    work_email: Optional[EmailStr] = None
    personal_address: Optional[str] = None
    personal_phone: Optional[str] = None
    profile_picture: Optional[str] = None
    wage: Optional[float] = None
    is_verified: Optional[bool] = None


class UserUpdateSelf(BaseModel):
    # Restricted fields that employees are allowed to edit
    personal_address: Optional[str] = None
    personal_phone: Optional[str] = None
    profile_picture: Optional[str] = None


class PasswordChange(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=6)


class LoginRequest(BaseModel):
    login_id_or_email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserResponse"


class UserResponse(BaseModel):
    id: int
    login_id: str
    email: EmailStr
    first_name: str
    last_name: str
    role: str
    is_verified: bool
    is_first_login: bool
    joining_year: int
    joining_serial: int
    department: str
    job_title: str
    work_phone: Optional[str] = None
    work_email: Optional[str] = None
    personal_address: Optional[str] = None
    personal_phone: Optional[str] = None
    profile_picture: Optional[str] = None
    wage: float
    created_at: datetime
    updated_at: datetime
    
    # Dynamic field for today's status indicator: "green", "airplane", "yellow"
    work_status: Optional[str] = "yellow"

    class Config:
        from_attributes = True


class UserCreatedResponse(BaseModel):
    user: UserResponse
    temp_password: str
    login_id: str
