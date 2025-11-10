# routes/admin.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, date
from database import (
    get_db, User, LeaveBalance, LeaveType, 
    TimesheetEntry, TimesheetUnlockRequest
)
from auth import get_current_user, hash_password
from pydantic import BaseModel, EmailStr
import uuid

router = APIRouter(prefix="/api/admin", tags=["Admin"])


# ============= SCHEMAS =============

class CreateUserRequest(BaseModel):
    email: EmailStr
    name: str
    password: str
    role: str
    department: str
    designation: str
    supervisor_id: str | None = None
    join_date: str | None = None


class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: str
    department: str
    designation: str
    supervisor_id: str | None
    join_date: str


class UnlockRequestResponse(BaseModel):
    id: str
    user_id: str
    employee_name: str
    employee_email: str
    timesheet_id: str
    date: str
    reason: str
    status: str
    requested_on: datetime
    approved_on: datetime | None
    approved_by: str | None
    remarks: str | None


class ReviewUnlockRequest(BaseModel):
    status: str  # 'approved' or 'rejected'
    remarks: str


# ============= MIDDLEWARE =============

def require_admin(current_user: User = Depends(get_current_user)):
    """Ensure user is Admin, HR, or CEO"""
    if current_user.role not in ['Admin', 'HR', 'CEO']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user


# ============= CREATE USER =============

@router.post("/users", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    data: CreateUserRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Create a new user (Admin only)"""
    
    # Check if email already exists
    existing_user = db.query(User).filter(User.email == data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Validate supervisor exists
    if data.supervisor_id:
        supervisor = db.query(User).filter(User.id == data.supervisor_id).first()
        if not supervisor:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Supervisor not found"
            )
    
    # Create new user
    new_user = User(
        id=str(uuid.uuid4()),
        email=data.email,
        name=data.name,
        password_hash=hash_password(data.password),
        role=data.role,
        department=data.department,
        designation=data.designation,
        supervisor_id=data.supervisor_id,
        join_date=datetime.strptime(data.join_date, '%Y-%m-%d').date() if data.join_date else date.today()
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
    
    return UserResponse(
        id=new_user.id,
        email=new_user.email,
        name=new_user.name,
        role=new_user.role,
        department=new_user.department or "",
        designation=new_user.designation or "",
        supervisor_id=new_user.supervisor_id,
        join_date=str(new_user.join_date)
    )


# ============= GET ALL USERS =============

@router.get("/users", response_model=List[UserResponse])
def get_all_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Get all users (Admin only)"""
    users = db.query(User).order_by(User.name).all()
    
    return [
        UserResponse(
            id=user.id,
            email=user.email,
            name=user.name,
            role=user.role,
            department=user.department or "",
            designation=user.designation or "",
            supervisor_id=user.supervisor_id,
            join_date=str(user.join_date)
        )
        for user in users
    ]


# ============= GET POTENTIAL SUPERVISORS =============

@router.get("/supervisors", response_model=List[UserResponse])
def get_potential_supervisors(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Get list of users who can be supervisors (Manager, Team Lead, CEO, HR)"""
    supervisors = db.query(User).filter(
        User.role.in_(['Manager', 'Team Lead', 'CEO', 'HR', 'Founder'])
    ).order_by(User.name).all()
    
    return [
        UserResponse(
            id=user.id,
            email=user.email,
            name=user.name,
            role=user.role,
            department=user.department or "",
            designation=user.designation or "",
            supervisor_id=user.supervisor_id,
            join_date=str(user.join_date)
        )
        for user in supervisors
    ]


# ============= GET UNLOCK REQUESTS (ADMIN VIEW) =============

@router.get("/unlock-requests", response_model=List[UnlockRequestResponse])
def get_all_unlock_requests(
    status_filter: str = 'pending',
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Get unlock requests with filters (Admin only)"""
    
    query = db.query(TimesheetUnlockRequest)
    
    if status_filter and status_filter != 'all':
        query = query.filter(TimesheetUnlockRequest.status == status_filter)
    
    requests = query.order_by(TimesheetUnlockRequest.requested_on.desc()).all()
    
    result = []
    for req in requests:
        user = db.query(User).filter(User.id == req.user_id).first()
        result.append(UnlockRequestResponse(
            id=req.id,
            user_id=req.user_id,
            employee_name=user.name if user else "Unknown",
            employee_email=user.email if user else "Unknown",
            timesheet_id=req.timesheet_id,
            date=str(req.date),
            reason=req.reason,
            status=req.status,
            requested_on=req.requested_on,
            approved_on=req.approved_on,
            approved_by=req.approved_by,
            remarks=req.remarks
        ))
    
    return result


# ============= ADMIN DASHBOARD STATS =============

@router.get("/dashboard-stats")
def get_admin_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Get admin dashboard statistics"""
    
    total_users = db.query(User).count()
    total_employees = db.query(User).filter(User.role == 'Employee').count()
    total_managers = db.query(User).filter(User.role.in_(['Manager', 'Team Lead'])).count()
    
    pending_unlocks = db.query(TimesheetUnlockRequest).filter(
        TimesheetUnlockRequest.status == 'pending'
    ).count()
    
    approved_unlocks = db.query(TimesheetUnlockRequest).filter(
        TimesheetUnlockRequest.status == 'approved'
    ).count()
    
    rejected_unlocks = db.query(TimesheetUnlockRequest).filter(
        TimesheetUnlockRequest.status == 'rejected'
    ).count()
    
    return {
        "total_users": total_users,
        "total_employees": total_employees,
        "total_managers": total_managers,
        "pending_unlock_requests": pending_unlocks,
        "approved_unlock_requests": approved_unlocks,
        "rejected_unlock_requests": rejected_unlocks
    }
