from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
from datetime import date, datetime, timedelta
from database import get_db, User, LeaveType, LeaveBalance, LeaveApplication, Notification
from schemas import (
    LoginRequest, RegisterRequest, TokenResponse, UserResponse,
    LeaveTypeResponse, LeaveBalanceResponse, ApplyLeaveRequest, LeaveApplicationResponse,
    ApproveRejectRequest, NotificationResponse, NotificationsSummary,
    HRStatistics, EmployeeBalanceResponse
)
from auth import (
    hash_password, verify_password, create_access_token, 
    get_current_user, get_user_permissions, require_permission
)

# Initialize FastAPI app
app = FastAPI(
    title="HR Leave Management API",
    description="Backend API for Leave Management System",
    version="1.0.0"
)

# CORS Configuration - Allow frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React app URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Helper function to calculate working days (excluding weekends)
def calculate_working_days(start_date: date, end_date: date) -> int:
    """Calculate number of working days between two dates (excluding weekends)"""
    days = 0
    current = start_date
    while current <= end_date:
        # 0=Monday, 6=Sunday
        if current.weekday() < 5:  # Monday to Friday
            days += 1
        current += timedelta(days=1)
    return days


# ============= AUTHENTICATION ENDPOINTS =============

@app.post("/api/auth/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register_user(data: RegisterRequest, db: Session = Depends(get_db)):
    """Register a new user"""
    
    # Check if email already exists
    existing_user = db.query(User).filter(User.email == data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    new_user = User(
        email=data.email,
        name=data.name,
        password_hash=hash_password(data.password),
        role=data.role,
        department=data.department,
        designation=data.designation,
        supervisor_id=data.supervisor_id,
        join_date=date.today()
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Create leave balances for the new user
    leave_types = db.query(LeaveType).filter(LeaveType.is_active == True).all()
    for leave_type in leave_types:
        balance = LeaveBalance(
            user_id=new_user.id,
            leave_type_id=leave_type.id,
            total=leave_type.yearly_quota,
            used=0,
            remaining=leave_type.yearly_quota,
            year=date.today().year
        )
        db.add(balance)
    
    db.commit()
    
    # Return user response
    return UserResponse(
        id=new_user.id,
        email=new_user.email,
        name=new_user.name,
        role=new_user.role,
        department=new_user.department,
        designation=new_user.designation,
        supervisor_id=new_user.supervisor_id,
        permissions=get_user_permissions(new_user.role)
    )


@app.post("/api/auth/login", response_model=TokenResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    """Login and get JWT token"""
    
    # Find user by email
    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Verify password
    if not verify_password(data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Create access token
    access_token = create_access_token(data={"sub": user.id})
    
    # Return token and user info
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse(
            id=user.id,
            email=user.email,
            name=user.name,
            role=user.role,
            department=user.department,
            designation=user.designation,
            supervisor_id=user.supervisor_id,
            permissions=get_user_permissions(user.role)
        )
    )


@app.get("/api/auth/me", response_model=UserResponse)
def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current logged-in user information"""
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        name=current_user.name,
        role=current_user.role,
        department=current_user.department,
        designation=current_user.designation,
        supervisor_id=current_user.supervisor_id,
        permissions=get_user_permissions(current_user.role)
    )


# ============= LEAVE TYPE ENDPOINTS =============

@app.get("/api/leave/types", response_model=List[LeaveTypeResponse])
def get_leave_types(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all active leave types"""
    leave_types = db.query(LeaveType).filter(LeaveType.is_active == True).all()
    return leave_types


# ============= LEAVE BALANCE ENDPOINTS =============

@app.get("/api/leave/balance", response_model=List[LeaveBalanceResponse])
def get_leave_balance(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get leave balance for current user"""
    balances = db.query(LeaveBalance).filter(
        LeaveBalance.user_id == current_user.id,
        LeaveBalance.year == date.today().year
    ).all()
    
    result = []
    for balance in balances:
        leave_type = db.query(LeaveType).filter(LeaveType.id == balance.leave_type_id).first()
        result.append(LeaveBalanceResponse(
            leave_type_id=balance.leave_type_id,
            leave_type=leave_type.name,
            total=balance.total,
            used=balance.used,
            remaining=balance.remaining
        ))
    
    return result


# ============= LEAVE APPLICATION ENDPOINTS =============

@app.post("/api/leave/apply", response_model=LeaveApplicationResponse, status_code=status.HTTP_201_CREATED)
def apply_leave(
    data: ApplyLeaveRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Apply for leave"""
    
    # Validate dates
    if data.end_date < data.start_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="End date cannot be before start date"
        )
    
    # Calculate working days
    days = calculate_working_days(data.start_date, data.end_date)
    
    if days == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No working days in selected date range (only weekends)"
        )
    
    # Check leave balance
    balance = db.query(LeaveBalance).filter(
        LeaveBalance.user_id == current_user.id,
        LeaveBalance.leave_type_id == data.leave_type_id,
        LeaveBalance.year == date.today().year
    ).first()
    
    if not balance:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Leave balance not found"
        )
    
    if balance.remaining < days:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient leave balance. You have {balance.remaining} days remaining, but requested {days} days."
        )
    
    # Get leave type
    leave_type = db.query(LeaveType).filter(LeaveType.id == data.leave_type_id).first()
    
    # Create leave application
    new_leave = LeaveApplication(
        user_id=current_user.id,
        leave_type_id=data.leave_type_id,
        start_date=data.start_date,
        end_date=data.end_date,
        days=days,
        reason=data.reason,
        status="Pending"
    )
    
    db.add(new_leave)
    db.commit()
    db.refresh(new_leave)
    
    # Create notification for supervisor/manager
    if current_user.supervisor_id:
        notification = Notification(
            user_id=current_user.supervisor_id,
            type="leave_applied",
            message=f"{current_user.name} applied for {leave_type.name} from {data.start_date} to {data.end_date}",
            related_leave_id=new_leave.id
        )
        db.add(notification)
        db.commit()
    
    return LeaveApplicationResponse(
        id=new_leave.id,
        user_id=new_leave.user_id,
        employee_name=current_user.name,
        leave_type=leave_type.name,
        leave_type_id=new_leave.leave_type_id,
        start_date=new_leave.start_date,
        end_date=new_leave.end_date,
        days=new_leave.days,
        reason=new_leave.reason,
        status=new_leave.status,
        supervisor_remarks=new_leave.supervisor_remarks,
        applied_on=new_leave.applied_on,
        approved_on=new_leave.approved_on
    )


@app.get("/api/leave/history", response_model=List[LeaveApplicationResponse])
def get_leave_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get leave history for current user"""
    leaves = db.query(LeaveApplication).filter(
        LeaveApplication.user_id == current_user.id
    ).order_by(LeaveApplication.applied_on.desc()).all()
    
    result = []
    for leave in leaves:
        leave_type = db.query(LeaveType).filter(LeaveType.id == leave.leave_type_id).first()
        result.append(LeaveApplicationResponse(
            id=leave.id,
            user_id=leave.user_id,
            employee_name=current_user.name,
            leave_type=leave_type.name,
            leave_type_id=leave.leave_type_id,
            start_date=leave.start_date,
            end_date=leave.end_date,
            days=leave.days,
            reason=leave.reason,
            status=leave.status,
            supervisor_remarks=leave.supervisor_remarks,
            applied_on=leave.applied_on,
            approved_on=leave.approved_on
        ))
    
    return result


# ============= APPROVAL ENDPOINTS (Manager/Team Lead/CEO/HR) =============

@app.get("/api/approvals/pending", response_model=List[LeaveApplicationResponse])
def get_pending_approvals(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("approve_team_leaves"))
):
    """Get pending leave approvals for manager/approver"""
    
    # Get team members (employees whose supervisor is current user)
    # Explicitly join on user_id (not approved_by)
    leaves = db.query(LeaveApplication).join(
        User, 
        LeaveApplication.user_id == User.id
    ).filter(
        LeaveApplication.status == "Pending",
        User.supervisor_id == current_user.id
    ).order_by(LeaveApplication.applied_on.desc()).all()

    
    result = []
    for leave in leaves:
        user = db.query(User).filter(User.id == leave.user_id).first()
        leave_type = db.query(LeaveType).filter(LeaveType.id == leave.leave_type_id).first()
        
        result.append(LeaveApplicationResponse(
            id=leave.id,
            user_id=leave.user_id,
            employee_name=user.name,
            leave_type=leave_type.name,
            leave_type_id=leave.leave_type_id,
            start_date=leave.start_date,
            end_date=leave.end_date,
            days=leave.days,
            reason=leave.reason,
            status=leave.status,
            supervisor_remarks=leave.supervisor_remarks,
            applied_on=leave.applied_on,
            approved_on=leave.approved_on
        ))
    
    return result


@app.put("/api/approvals/approve/{leave_id}", response_model=LeaveApplicationResponse)
def approve_leave(
    leave_id: str,
    data: ApproveRejectRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("approve_team_leaves"))
):
    """Approve a leave application"""
    
    leave = db.query(LeaveApplication).filter(LeaveApplication.id == leave_id).first()
    if not leave:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Leave application not found"
        )
    
    # Check if this user is the supervisor of the employee
    employee = db.query(User).filter(User.id == leave.user_id).first()
    if employee.supervisor_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only approve leaves of your team members"
        )
    
    # Update leave status
    leave.status = "Approved"
    leave.supervisor_remarks = data.remarks
    leave.approved_on = datetime.utcnow()
    leave.approved_by = current_user.id
    
    # Update leave balance
    balance = db.query(LeaveBalance).filter(
        LeaveBalance.user_id == leave.user_id,
        LeaveBalance.leave_type_id == leave.leave_type_id,
        LeaveBalance.year == date.today().year
    ).first()
    
    if balance:
        balance.used += leave.days
        balance.remaining -= leave.days
    
    # Create notification for employee
    leave_type = db.query(LeaveType).filter(LeaveType.id == leave.leave_type_id).first()
    notification = Notification(
        user_id=leave.user_id,
        type="leave_approved",
        message=f"Your {leave_type.name} from {leave.start_date} to {leave.end_date} has been approved",
        related_leave_id=leave.id
    )
    db.add(notification)
    
    db.commit()
    db.refresh(leave)
    
    return LeaveApplicationResponse(
        id=leave.id,
        user_id=leave.user_id,
        employee_name=employee.name,
        leave_type=leave_type.name,
        leave_type_id=leave.leave_type_id,
        start_date=leave.start_date,
        end_date=leave.end_date,
        days=leave.days,
        reason=leave.reason,
        status=leave.status,
        supervisor_remarks=leave.supervisor_remarks,
        applied_on=leave.applied_on,
        approved_on=leave.approved_on
    )


@app.put("/api/approvals/reject/{leave_id}", response_model=LeaveApplicationResponse)
def reject_leave(
    leave_id: str,
    data: ApproveRejectRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("approve_team_leaves"))
):
    """Reject a leave application"""
    
    leave = db.query(LeaveApplication).filter(LeaveApplication.id == leave_id).first()
    if not leave:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Leave application not found"
        )
    
    # Check if this user is the supervisor of the employee
    employee = db.query(User).filter(User.id == leave.user_id).first()
    if employee.supervisor_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only reject leaves of your team members"
        )
    
    # Update leave status
    leave.status = "Rejected"
    leave.supervisor_remarks = data.remarks
    leave.approved_on = datetime.utcnow()
    leave.approved_by = current_user.id
    
    # Create notification for employee
    leave_type = db.query(LeaveType).filter(LeaveType.id == leave.leave_type_id).first()
    notification = Notification(
        user_id=leave.user_id,
        type="leave_rejected",
        message=f"Your {leave_type.name} from {leave.start_date} to {leave.end_date} has been rejected",
        related_leave_id=leave.id
    )
    db.add(notification)
    
    db.commit()
    db.refresh(leave)
    
    return LeaveApplicationResponse(
        id=leave.id,
        user_id=leave.user_id,
        employee_name=employee.name,
        leave_type=leave_type.name,
        leave_type_id=leave.leave_type_id,
        start_date=leave.start_date,
        end_date=leave.end_date,
        days=leave.days,
        reason=leave.reason,
        status=leave.status,
        supervisor_remarks=leave.supervisor_remarks,
        applied_on=leave.applied_on,
        approved_on=leave.approved_on
    )


# ============= NOTIFICATION ENDPOINTS =============

@app.get("/api/notifications", response_model=NotificationsSummary)
def get_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get notifications for current user"""
    notifications = db.query(Notification).filter(
        Notification.user_id == current_user.id
    ).order_by(Notification.created_at.desc()).limit(50).all()
    
    unread_count = db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).count()
    
    return NotificationsSummary(
        unread_count=unread_count,
        notifications=notifications
    )


@app.put("/api/notifications/{notification_id}/read")
def mark_notification_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mark notification as read"""
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).first()
    
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    
    notification.is_read = True
    db.commit()
    
    return {"message": "Notification marked as read"}


# ============= HR DASHBOARD ENDPOINTS =============

@app.get("/api/hr/statistics", response_model=HRStatistics)
def get_hr_statistics(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("manage_hr"))
):
    """Get HR dashboard statistics"""
    
    total_employees = db.query(User).count()
    total_leave_requests = db.query(LeaveApplication).count()
    pending_approvals = db.query(LeaveApplication).filter(LeaveApplication.status == "Pending").count()
    approved_leaves = db.query(LeaveApplication).filter(LeaveApplication.status == "Approved").count()
    
    # Get employees on leave today
    today = date.today()
    employees_on_leave = db.query(LeaveApplication).filter(
        LeaveApplication.status == "Approved",
        LeaveApplication.start_date <= today,
        LeaveApplication.end_date >= today
    ).all()
    
    on_leave_today = len(employees_on_leave)
    
    # Format employees on leave
    employees_on_leave_list = []
    for leave in employees_on_leave:
        user = db.query(User).filter(User.id == leave.user_id).first()
        leave_type = db.query(LeaveType).filter(LeaveType.id == leave.leave_type_id).first()
        employees_on_leave_list.append(LeaveApplicationResponse(
            id=leave.id,
            user_id=leave.user_id,
            employee_name=user.name,
            leave_type=leave_type.name,
            leave_type_id=leave.leave_type_id,
            start_date=leave.start_date,
            end_date=leave.end_date,
            days=leave.days,
            reason=leave.reason,
            status=leave.status,
            supervisor_remarks=leave.supervisor_remarks,
            applied_on=leave.applied_on,
            approved_on=leave.approved_on
        ))
    
    # Get pending approvals list
    pending_list = db.query(LeaveApplication).filter(LeaveApplication.status == "Pending").all()
    pending_approvals_list = []
    for leave in pending_list:
        user = db.query(User).filter(User.id == leave.user_id).first()
        leave_type = db.query(LeaveType).filter(LeaveType.id == leave.leave_type_id).first()
        pending_approvals_list.append(LeaveApplicationResponse(
            id=leave.id,
            user_id=leave.user_id,
            employee_name=user.name,
            leave_type=leave_type.name,
            leave_type_id=leave.leave_type_id,
            start_date=leave.start_date,
            end_date=leave.end_date,
            days=leave.days,
            reason=leave.reason,
            status=leave.status,
            supervisor_remarks=leave.supervisor_remarks,
            applied_on=leave.applied_on,
            approved_on=leave.approved_on
        ))
    
    # Department-wise stats
    from collections import defaultdict
    dept_stats = defaultdict(lambda: {"department": "", "total_employees": 0, "pending_approvals": 0})
    
    users = db.query(User).all()
    for user in users:
        dept = user.department or "Unknown"
        dept_stats[dept]["department"] = dept
        dept_stats[dept]["total_employees"] += 1
    
    # Count pending approvals per department
    pending_leaves = db.query(LeaveApplication).filter(LeaveApplication.status == "Pending").all()
    for leave in pending_leaves:
        user = db.query(User).filter(User.id == leave.user_id).first()
        dept = user.department or "Unknown"
        dept_stats[dept]["pending_approvals"] += 1
    
    return HRStatistics(
        total_employees=total_employees,
        total_leave_requests=total_leave_requests,
        pending_approvals=pending_approvals,
        approved_leaves=approved_leaves,
        on_leave_today=on_leave_today,
        employees_on_leave_today=employees_on_leave_list,
        pending_approvals_list=pending_approvals_list,
        department_stats=list(dept_stats.values())
    )


@app.get("/api/hr/all-leaves", response_model=List[LeaveApplicationResponse])
def get_all_leaves(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("manage_hr"))
):
    """Get all leave applications (HR only)"""
    leaves = db.query(LeaveApplication).order_by(LeaveApplication.applied_on.desc()).all()
    
    result = []
    for leave in leaves:
        user = db.query(User).filter(User.id == leave.user_id).first()
        leave_type = db.query(LeaveType).filter(LeaveType.id == leave.leave_type_id).first()
        
        result.append(LeaveApplicationResponse(
            id=leave.id,
            user_id=leave.user_id,
            employee_name=user.name,
            leave_type=leave_type.name,
            leave_type_id=leave.leave_type_id,
            start_date=leave.start_date,
            end_date=leave.end_date,
            days=leave.days,
            reason=leave.reason,
            status=leave.status,
            supervisor_remarks=leave.supervisor_remarks,
            applied_on=leave.applied_on,
            approved_on=leave.approved_on
        ))
    
    return result


@app.get("/api/hr/employee-balances", response_model=List[EmployeeBalanceResponse])
def get_employee_balances(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("manage_hr"))
):
    """Get all employees' leave balances (HR only)"""
    users = db.query(User).all()
    
    result = []
    for user in users:
        balances = db.query(LeaveBalance).filter(
            LeaveBalance.user_id == user.id,
            LeaveBalance.year == date.today().year
        ).all()
        
        casual = {"total": 0, "used": 0, "remaining": 0}
        sick = {"total": 0, "used": 0, "remaining": 0}
        earned = {"total": 0, "used": 0, "remaining": 0}
        
        for balance in balances:
            leave_type = db.query(LeaveType).filter(LeaveType.id == balance.leave_type_id).first()
            if leave_type.name == "Casual Leave":
                casual = {"total": balance.total, "used": balance.used, "remaining": balance.remaining}
            elif leave_type.name == "Sick Leave":
                sick = {"total": balance.total, "used": balance.used, "remaining": balance.remaining}
            elif leave_type.name == "Earned Leave":
                earned = {"total": balance.total, "used": balance.used, "remaining": balance.remaining}
        
        result.append(EmployeeBalanceResponse(
            employee_id=user.id,
            employee_name=user.name,
            email=user.email,
            designation=user.designation,
            casual=casual,
            sick=sick,
            earned=earned
        ))
    
    return result


@app.get("/api/hr/employees", response_model=List[UserResponse])
def get_all_employees(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("manage_hr"))
):
    """Get all employees (HR only)"""
    users = db.query(User).all()
    
    result = []
    for user in users:
        result.append(UserResponse(
            id=user.id,
            email=user.email,
            name=user.name,
            role=user.role,
            department=user.department,
            designation=user.designation,
            supervisor_id=user.supervisor_id,
            permissions=get_user_permissions(user.role)
        ))
    
    return result


# ============= ROOT ENDPOINT =============

@app.get("/")
def root():
    """API root endpoint"""
    return {
        "message": "HR Leave Management API",
        "version": "1.0.0",
        "docs": "/docs",
        "status": "running"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
