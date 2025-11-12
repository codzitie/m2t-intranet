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
    
    # ========== TWO-LEVEL APPROVAL FIELDS ==========
    l1_status: Optional[str] = "Pending"
    l1_approved_by: Optional[str] = None
    l1_approved_by_name: Optional[str] = None
    l1_approved_on: Optional[datetime] = None
    l1_remarks: Optional[str] = None
    
    l2_status: Optional[str] = "Pending"
    l2_approved_by: Optional[str] = None
    l2_approved_by_name: Optional[str] = None
    l2_approved_on: Optional[datetime] = None
    l2_remarks: Optional[str] = None
    # ==============================================
    
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



# ============= CEO DASHBOARD SCHEMAS (NEW) =============



class CEOApprovalStats(BaseModel):
    """CEO-specific approval statistics"""
    pending_l2_approvals: int
    total_l1_approved: int
    total_final_approved: int
    rejected_by_ceo: int



class CEODashboardResponse(BaseModel):
    """CEO dashboard overview"""
    stats: CEOApprovalStats
    pending_l2_leaves: List[LeaveApplicationResponse]
    recent_approvals: List[LeaveApplicationResponse]



# =============== TIMESHEET SCHEMAS ===============



class TimesheetActivitySchema(BaseModel):
    """Schema for timesheet activity"""
    slot: str
    description: str
    output: Optional[str] = None
    start_time: str
    end_time: str



class TimesheetEntryCreateSchema(BaseModel):
    """Schema for creating timesheet entry"""
    date: str
    start_time: str
    end_time: str
    description: str
    activities: Optional[List[TimesheetActivitySchema]] = []



class TimesheetEntryResponseSchema(BaseModel):
    """Schema for timesheet entry response"""
    id: str
    user_id: str
    date: str
    start_time: str
    end_time: str
    hours_logged: Optional[float] = None
    description: Optional[str] = None
    status: str
    is_locked: bool
    is_absent: bool
    activities: Optional[List[TimesheetActivitySchema]] = []
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    
    class Config:
        from_attributes = True



class TimesheetStatsSchema(BaseModel):
    """Schema for timesheet statistics"""
    filled_days: int
    pending_days: int
    locked_days: int
    absent_days: int
    total_days: int
    total_hours: float



class UnlockRequestCreateSchema(BaseModel):
    """Schema for creating unlock request"""
    timesheet_id: str
    date: str
    reason: str



class UnlockRequestResponseSchema(BaseModel):
    """Schema for unlock request response"""
    id: str
    timesheet_id: str
    employee_name: str
    employee_id: str
    date: str
    reason: str
    status: str
    requested_on: str
    
    class Config:
        from_attributes = True



class UnlockRequestApproveSchema(BaseModel):
    """Schema for approving/rejecting unlock request"""
    status: str  # "approved" or "rejected"
    remarks: Optional[str] = None



class HRTimesheetDashboardSchema(BaseModel):
    """Schema for HR timesheet dashboard"""
    total_employees: int
    today_filled: int
    today_pending: int
    today_absent: int
    pending_unlocks: int
    month_summary: dict



class TimesheetEmployeeResponseSchema(BaseModel):
    """Schema for getting employee timesheet entries"""
    id: str
    employee_name: str
    date: str
    start_time: str
    end_time: str
    hours_logged: Optional[float] = None
    description: Optional[str] = None
    status: str
    is_locked: bool
    
    class Config:
        from_attributes = True
