from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List
from datetime import date, datetime

# ============= AUTH SCHEMAS =============

class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)

class RegisterRequest(BaseModel):
    email: EmailStr
    name: str = Field(..., min_length=2)
    password: str = Field(..., min_length=6)
    role: str = Field(..., pattern="^(Employee|Manager|Team Lead|CEO|Founder|HR)$")
    department: Optional[str] = None
    designation: Optional[str] = None
    supervisor_id: Optional[str] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserResponse"

# ============= USER SCHEMAS =============

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: str
    department: Optional[str]
    designation: Optional[str]
    supervisor_id: Optional[str]
    permissions: List[str]
    
    class Config:
        from_attributes = True

# ============= LEAVE TYPE SCHEMAS =============

class LeaveTypeResponse(BaseModel):
    id: int
    name: str
    yearly_quota: int
    color: str
    
    class Config:
        from_attributes = True

# ============= LEAVE BALANCE SCHEMAS =============

class LeaveBalanceResponse(BaseModel):
    leave_type_id: int
    leave_type: str
    total: int
    used: int
    remaining: int
    
    class Config:
        from_attributes = True

# ============= LEAVE APPLICATION SCHEMAS =============

class ApplyLeaveRequest(BaseModel):
    leave_type_id: int
    start_date: date
    end_date: date
    reason: str = Field(..., min_length=5, max_length=500)

class LeaveApplicationResponse(BaseModel):
    id: str
    user_id: str
    employee_name: str
    leave_type: str
    leave_type_id: int
    start_date: date
    end_date: date
    days: int
    reason: str
    status: str
    supervisor_remarks: Optional[str]
    applied_on: datetime
    approved_on: Optional[datetime]
    
    class Config:
        from_attributes = True

class ApproveRejectRequest(BaseModel):
    remarks: str = Field(..., min_length=5, max_length=500)

# ============= NOTIFICATION SCHEMAS =============

class NotificationResponse(BaseModel):
    id: int
    type: str
    message: str
    related_leave_id: Optional[str]
    is_read: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class NotificationsSummary(BaseModel):
    unread_count: int
    notifications: List[NotificationResponse]

# ============= HR DASHBOARD SCHEMAS =============

class DepartmentStats(BaseModel):
    department: str
    total_employees: int
    pending_approvals: int

class HRStatistics(BaseModel):
    total_employees: int
    total_leave_requests: int
    pending_approvals: int
    approved_leaves: int
    on_leave_today: int
    employees_on_leave_today: List[LeaveApplicationResponse]
    pending_approvals_list: List[LeaveApplicationResponse]
    department_stats: List[DepartmentStats]

class EmployeeBalanceResponse(BaseModel):
    employee_id: str
    employee_name: str
    email: str
    designation: Optional[str]
    casual: dict  # {total, used, remaining}
    sick: dict
    earned: dict
