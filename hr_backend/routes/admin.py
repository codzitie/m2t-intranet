# routes/admin.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, date
from database import (
    get_db, User, LeaveBalance, LeaveType,
    TimesheetEntry, TimesheetUnlockRequest, UserCreationRequest,
    LeaveApplication, Notification, TimesheetActivity,
    UserDeletionRequest  # Add this!
)
from schemas import (
    CreateUserDeletionRequest,
    UserDeletionRequestResponse,
    ReviewUserDeletionRequest
)

from auth import get_current_user, hash_password
from pydantic import BaseModel, EmailStr
from email_service import send_new_user_credentials
import uuid
import secrets
import string

router = APIRouter(prefix="/api/admin", tags=["Admin"])

# ============= SCHEMAS =============

class CreateUserRequest(BaseModel):
    email: EmailStr
    name: str
    role: str
    department: str
    designation: str
    supervisor_id: str | None = None
    join_date: str | None = None
    employment_type: str | None = None

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: str
    department: str
    designation: str
    supervisor_id: str | None
    join_date: str
    employment_type: str | None = None

class UserCreationRequestResponse(BaseModel):
    id: str
    requested_by: str
    requested_by_name: str
    name: str
    email: str
    role: str
    department: str
    designation: str
    supervisor_id: str | None
    join_date: str
    status: str
    approver_id: str | None
    approver_name: str | None
    approved_on: datetime | None
    rejection_remarks: str | None
    created_at: datetime

class ReviewUserCreationRequest(BaseModel):
    status: str  # 'approved' or 'rejected'
    remarks: str | None = None

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
    status: str
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

def require_manager(current_user: User = Depends(get_current_user)):
    """Ensure user is Manager, Team Lead, or higher"""
    if current_user.role not in ['Manager', 'Team Lead', 'CEO', 'HR', 'Founder']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Manager access required"
        )
    return current_user



@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Delete a user and cascade supervisor to their manager (if any)."""

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Get this user's supervisor (proposed new manager for subordinates)
    new_supervisor_id = user.supervisor_id

    # Update direct reports to report to this user's manager (or null if none)
    db.query(User).filter(User.supervisor_id == user_id).update(
        {User.supervisor_id: new_supervisor_id},
        synchronize_session=False
    )

    # Nullify referencing FK columns in leave_applications before deleting user (avoid FK error)
    db.query(LeaveApplication).filter(LeaveApplication.approved_by == user_id).update(
        {LeaveApplication.approved_by: None}, synchronize_session=False)
    db.query(LeaveApplication).filter(LeaveApplication.l1_approved_by == user_id).update(
        {LeaveApplication.l1_approved_by: None}, synchronize_session=False)
    db.query(LeaveApplication).filter(LeaveApplication.l2_approved_by == user_id).update(
        {LeaveApplication.l2_approved_by: None}, synchronize_session=False)

    # --- normal cascade delete for all records directly belonging to user ---
    db.query(LeaveBalance).filter(LeaveBalance.user_id == user_id).delete(synchronize_session=False)
    db.query(LeaveApplication).filter(LeaveApplication.user_id == user_id).delete(synchronize_session=False)
    db.query(Notification).filter(Notification.user_id == user_id).delete(synchronize_session=False)
    db.query(TimesheetUnlockRequest).filter(TimesheetUnlockRequest.user_id == user_id).delete(synchronize_session=False)
    db.query(UserCreationRequest).filter(UserCreationRequest.requested_by == user_id).delete(synchronize_session=False)

    # Delete TimesheetActivity by all timesheet_entries of this user
    timesheet_entry_ids = [
        entry.id
        for entry in db.query(TimesheetEntry.id).filter(TimesheetEntry.user_id == user_id).all()
    ]
    if timesheet_entry_ids:
        db.query(TimesheetActivity).filter(TimesheetActivity.timesheet_id.in_(timesheet_entry_ids)).delete(synchronize_session=False)

    # Delete timesheet entries
    db.query(TimesheetEntry).filter(TimesheetEntry.user_id == user_id).delete(synchronize_session=False)

    # Finally, delete the user record itself
    db.delete(user)
    db.commit()
    return




class UpdateUserRequest(BaseModel):
    name: str
    email: EmailStr
    role: str
    department: str
    designation: str
    supervisor_id: str | None = None
    join_date: str | None = None
    employment_type: str | None = None

@router.put("/users/{user_id}", response_model=UserResponse)
def update_user(
    user_id: str,
    data: UpdateUserRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    email_user = db.query(User).filter(User.email == data.email, User.id != user_id).first()
    if email_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already in use by another user"
        )
    
    user.name = data.name
    user.email = data.email
    user.role = data.role
    user.department = data.department
    user.designation = data.designation
    user.supervisor_id = data.supervisor_id or None
    if data.join_date:
        user.join_date = datetime.strptime(data.join_date, '%Y-%m-%d').date()
    user.employment_type = data.employment_type  # << Added here
    db.commit()
    db.refresh(user)
    
    return UserResponse(
        id=user.id,
        email=user.email,
        name=user.name,
        role=user.role,
        department=user.department or "",
        designation=user.designation or "",
        supervisor_id=user.supervisor_id,
        join_date=str(user.join_date),
        employment_type=user.employment_type
    )

# ============= UTILITY =============

def generate_secure_password(length: int = 12) -> str:
    """Generate a secure random password"""
    lowercase = string.ascii_lowercase
    uppercase = string.ascii_uppercase
    digits = string.digits
    special = "!@#$%^&*"
    
    password = [
        secrets.choice(lowercase),
        secrets.choice(uppercase),
        secrets.choice(digits),
        secrets.choice(special)
    ]
    
    all_chars = lowercase + uppercase + digits + special
    password += [secrets.choice(all_chars) for _ in range(length - 4)]
    
    secrets.SystemRandom().shuffle(password)
    
    return ''.join(password)

# ============= CREATE USER REQUEST (NOT DIRECT USER) =============

@router.post("/user-requests", response_model=UserCreationRequestResponse, status_code=status.HTTP_201_CREATED)
def create_user_request(
    data: CreateUserRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Create a user creation request (requires manager approval)"""
    
    # Check if email already exists
    existing_user = db.query(User).filter(User.email == data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Check if there's already a pending request for this email
    existing_request = db.query(UserCreationRequest).filter(
        UserCreationRequest.email == data.email,
        UserCreationRequest.status == 'pending'
    ).first()
    if existing_request:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A pending request for this email already exists"
        )
    
    # Validate supervisor exists
    if data.supervisor_id:
        supervisor = db.query(User).filter(User.id == data.supervisor_id).first()
        if not supervisor:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Supervisor not found"
            )
    
    # Create user creation request with employment_type
    request = UserCreationRequest(
        id=str(uuid.uuid4()),
        requested_by=current_user.id,
        requested_by_name=current_user.name,
        name=data.name,
        email=data.email,
        role=data.role,
        department=data.department,
        designation=data.designation,
        supervisor_id=data.supervisor_id,
        join_date=datetime.strptime(data.join_date, '%Y-%m-%d').date() if data.join_date else date.today(),
        employment_type=data.employment_type,
        status='pending'
    )
    
    db.add(request)
    db.commit()
    db.refresh(request)
    
    return UserCreationRequestResponse(
        id=request.id,
        requested_by=request.requested_by,
        requested_by_name=request.requested_by_name,
        name=request.name,
        email=request.email,
        role=request.role,
        department=request.department or "",
        designation=request.designation or "",
        supervisor_id=request.supervisor_id,
        join_date=str(request.join_date),
        status=request.status,
        approver_id=request.approver_id,
        approver_name=request.approver_name,
        approved_on=request.approved_on,
        rejection_remarks=request.rejection_remarks,
        created_at=request.created_at
    )

# ============= GET ALL USER CREATION REQUESTS =============

@router.get("/user-requests", response_model=List[UserCreationRequestResponse])
def get_user_requests(
    status_filter: str = 'pending',
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager)
):
    """Get all user creation requests (Manager and above)"""
    
    query = db.query(UserCreationRequest)
    
    if status_filter and status_filter != 'all':
        query = query.filter(UserCreationRequest.status == status_filter)
    
    requests = query.order_by(UserCreationRequest.created_at.desc()).all()
    
    return [
        UserCreationRequestResponse(
            id=req.id,
            requested_by=req.requested_by,
            requested_by_name=req.requested_by_name,
            name=req.name,
            email=req.email,
            role=req.role,
            department=req.department or "",
            designation=req.designation or "",
            supervisor_id=req.supervisor_id,
            join_date=str(req.join_date),
            status=req.status,
            approver_id=req.approver_id,
            approver_name=req.approver_name,
            approved_on=req.approved_on,
            rejection_remarks=req.rejection_remarks,
            created_at=req.created_at
        )
        for req in requests
    ]

# ============= APPROVE/REJECT USER CREATION REQUEST =============

@router.put("/user-requests/{request_id}/review", response_model=UserCreationRequestResponse)
def review_user_creation_request(
    request_id: str,
    review: ReviewUserCreationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager)
):
    """Approve or reject a user creation request (Manager and above)"""
    
    # Get the request
    request = db.query(UserCreationRequest).filter(UserCreationRequest.id == request_id).first()
    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User creation request not found"
        )
    
    if request.status != 'pending':
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Request already {request.status}"
        )
    
    # Update request status
    request.status = review.status
    request.approver_id = current_user.id
    request.approver_name = current_user.name
    request.approved_on = datetime.utcnow()
    request.rejection_remarks = review.remarks
    request.updated_at = datetime.utcnow()
    
    # If approved, create the actual user with employment_type
    if review.status == 'approved':
        existing_user = db.query(User).filter(User.email == request.email).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        temporary_password = generate_secure_password(12)
        
        new_user = User(
            id=str(uuid.uuid4()),
            email=request.email,
            name=request.name,
            password_hash=hash_password(temporary_password),
            role=request.role,
            department=request.department,
            designation=request.designation,
            supervisor_id=request.supervisor_id,
            join_date=request.join_date,
            employment_type=request.employment_type  # << Added here
        )
        
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
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
        
        try:
            send_new_user_credentials(
                email=new_user.email,
                username=new_user.name,
                temporary_password=temporary_password,
                role=new_user.role,
                department=new_user.department
            )
            print(f"✅ Welcome email sent to {new_user.email}")
        except Exception as e:
            print(f"⚠️ Failed to send welcome email: {e}")
    
    db.commit()
    db.refresh(request)
    
    return UserCreationRequestResponse(
        id=request.id,
        requested_by=request.requested_by,
        requested_by_name=request.requested_by_name,
        name=request.name,
        email=request.email,
        role=request.role,
        department=request.department or "",
        designation=request.designation or "",
        supervisor_id=request.supervisor_id,
        join_date=str(request.join_date),
        status=request.status,
        approver_id=request.approver_id,
        approver_name=request.approver_name,
        approved_on=request.approved_on,
        rejection_remarks=request.rejection_remarks,
        created_at=request.created_at
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
            employment_type=user.employment_type,
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
    """Get list of users who can be supervisors"""
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

# ============= GET UNLOCK REQUESTS =============

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
    
    pending_user_requests = db.query(UserCreationRequest).filter(
        UserCreationRequest.status == 'pending'
    ).count()
    
    return {
        "total_users": total_users,
        "total_employees": total_employees,
        "total_managers": total_managers,
        "pending_unlock_requests": pending_unlocks,
        "approved_unlock_requests": approved_unlocks,
        "rejected_unlock_requests": rejected_unlocks,
        "pending_user_requests": pending_user_requests
    }


# ============= USER DELETION REQUESTS =============

@router.post("/user-deletion-requests", response_model=UserDeletionRequestResponse, status_code=status.HTTP_201_CREATED)
def create_user_deletion_request(
    data: CreateUserDeletionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Create a user deletion request (requires manager approval)"""
    
    # Get the user to be deleted
    user_to_delete = db.query(User).filter(User.id == data.user_id).first()
    if not user_to_delete:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Check if there's already a pending request for this user
    existing_request = db.query(UserDeletionRequest).filter(
        UserDeletionRequest.user_id == data.user_id,
        UserDeletionRequest.status == 'pending'
    ).first()
    if existing_request:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A pending deletion request for this user already exists"
        )
    
    # Create deletion request
    request = UserDeletionRequest(
        id=str(uuid.uuid4()),
        requested_by=current_user.id,
        requested_by_name=current_user.name,
        user_id=user_to_delete.id,
        user_name=user_to_delete.name,
        user_email=user_to_delete.email,
        reason=data.reason,
        status='pending'
    )
    
    db.add(request)
    db.commit()
    db.refresh(request)
    
    return UserDeletionRequestResponse(
        id=request.id,
        requested_by=request.requested_by,
        requested_by_name=request.requested_by_name,
        user_id=request.user_id,
        user_name=request.user_name,
        user_email=request.user_email,
        reason=request.reason,
        status=request.status,
        approver_id=request.approver_id,
        approver_name=request.approver_name,
        approved_on=request.approved_on,
        rejection_remarks=request.rejection_remarks,
        created_at=request.created_at
    )


@router.get("/user-deletion-requests", response_model=List[UserDeletionRequestResponse])
def get_user_deletion_requests(
    status_filter: str = 'pending',
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager)
):
    """Get all user deletion requests (Manager and above)"""
    
    query = db.query(UserDeletionRequest)
    
    if status_filter and status_filter != 'all':
        query = query.filter(UserDeletionRequest.status == status_filter)
    
    requests = query.order_by(UserDeletionRequest.created_at.desc()).all()
    
    return [
        UserDeletionRequestResponse(
            id=req.id,
            requested_by=req.requested_by,
            requested_by_name=req.requested_by_name,
            user_id=req.user_id,
            user_name=req.user_name,
            user_email=req.user_email,
            reason=req.reason,
            status=req.status,
            approver_id=req.approver_id,
            approver_name=req.approver_name,
            approved_on=req.approved_on,
            rejection_remarks=req.rejection_remarks,
            created_at=req.created_at
        )
        for req in requests
    ]


@router.put("/user-deletion-requests/{request_id}/review", response_model=UserDeletionRequestResponse)
def review_user_deletion_request(
    request_id: str,
    review: ReviewUserDeletionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager)
):
    """Approve or reject a user deletion request (Manager and above)"""
    
    # Get the request
    request = db.query(UserDeletionRequest).filter(UserDeletionRequest.id == request_id).first()
    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User deletion request not found"
        )
    
    if request.status != 'pending':
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Request already {request.status}"
        )
    
    # Update request status
    request.status = review.status
    request.approver_id = current_user.id
    request.approver_name = current_user.name
    request.approved_on = datetime.utcnow()
    request.rejection_remarks = review.remarks
    request.updated_at = datetime.utcnow()
    
    # ⭐ Store response data BEFORE any deletion
    response_data = UserDeletionRequestResponse(
        id=request.id,
        requested_by=request.requested_by,
        requested_by_name=request.requested_by_name,
        user_id=request.user_id,
        user_name=request.user_name,
        user_email=request.user_email,
        reason=request.reason,
        status=request.status,
        approver_id=request.approver_id,
        approver_name=request.approver_name,
        approved_on=request.approved_on,
        rejection_remarks=request.rejection_remarks,
        created_at=request.created_at
    )
    
    # Commit the request status update first
    db.commit()
    
    # If approved, delete the actual user
    if review.status == 'approved':
        user = db.query(User).filter(User.id == request.user_id).first()
        if user:
            # Use the same deletion logic
            new_supervisor_id = user.supervisor_id
            db.query(User).filter(User.supervisor_id == user.id).update(
                {User.supervisor_id: new_supervisor_id}, synchronize_session=False)
            
            db.query(LeaveApplication).filter(LeaveApplication.approved_by == user.id).update(
                {LeaveApplication.approved_by: None}, synchronize_session=False)
            db.query(LeaveApplication).filter(LeaveApplication.l1_approved_by == user.id).update(
                {LeaveApplication.l1_approved_by: None}, synchronize_session=False)
            db.query(LeaveApplication).filter(LeaveApplication.l2_approved_by == user.id).update(
                {LeaveApplication.l2_approved_by: None}, synchronize_session=False)
            
            db.query(LeaveBalance).filter(LeaveBalance.user_id == user.id).delete(synchronize_session=False)
            db.query(LeaveApplication).filter(LeaveApplication.user_id == user.id).delete(synchronize_session=False)
            db.query(Notification).filter(Notification.user_id == user.id).delete(synchronize_session=False)
            db.query(TimesheetUnlockRequest).filter(TimesheetUnlockRequest.user_id == user.id).delete(synchronize_session=False)
            db.query(UserCreationRequest).filter(UserCreationRequest.requested_by == user.id).delete(synchronize_session=False)
            
            timesheet_entry_ids = [
                entry.id for entry in db.query(TimesheetEntry.id).filter(TimesheetEntry.user_id == user.id).all()
            ]
            if timesheet_entry_ids:
                db.query(TimesheetActivity).filter(TimesheetActivity.timesheet_id.in_(timesheet_entry_ids)).delete(synchronize_session=False)
            
            db.query(TimesheetEntry).filter(TimesheetEntry.user_id == user.id).delete(synchronize_session=False)
            db.delete(user)
            db.commit()
    
    # ⭐ Return the response data we captured earlier
    return response_data
