from sqlalchemy import create_engine, Column, String, Integer, Date, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import uuid
from config import settings


# Database connection
engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


# Dependency to get database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Database Models


class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, nullable=False, index=True)
    name = Column(String, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, nullable=False)  # Employee, Supervisor, HR, CEO
    department = Column(String)
    designation = Column(String)
    supervisor_id = Column(String, ForeignKey("users.id"), nullable=True)
    join_date = Column(Date)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    two_fa_code = Column(String(6), nullable=True)
    two_fa_code_expires = Column(DateTime, nullable=True)
    
    # Relationships
    leave_balances = relationship("LeaveBalance", back_populates="user")
    leave_applications = relationship("LeaveApplication", foreign_keys="LeaveApplication.user_id", back_populates="user")
    notifications = relationship("Notification", back_populates="user")
    last_login = Column(DateTime, default=None, nullable=True)
    prev_login = Column(DateTime, default=None, nullable=True)
    employment_type = Column(String(20), nullable=True)  # 'F', 'P', or 'V'




class LeaveType(Base):
    __tablename__ = "leave_types"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    yearly_quota = Column(Integer, nullable=False)
    color = Column(String, default="#3B82F6")
    is_active = Column(Boolean, default=True)
    
    # Relationships
    leave_balances = relationship("LeaveBalance", back_populates="leave_type")
    leave_applications = relationship("LeaveApplication", back_populates="leave_type")



class LeaveBalance(Base):
    __tablename__ = "leave_balances"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    leave_type_id = Column(Integer, ForeignKey("leave_types.id"), nullable=False)
    total = Column(Integer, nullable=False)
    used = Column(Integer, default=0)
    remaining = Column(Integer, nullable=False)
    year = Column(Integer, nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="leave_balances")
    leave_type = relationship("LeaveType", back_populates="leave_balances")



class LeaveApplication(Base):
    __tablename__ = "leave_applications"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    leave_type_id = Column(Integer, ForeignKey("leave_types.id"), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    days = Column(Integer, nullable=False)
    reason = Column(Text)
    status = Column(String, default="Pending")  # Pending, L1-Approved, Approved, Rejected
    supervisor_remarks = Column(Text)
    applied_on = Column(DateTime, default=datetime.utcnow)
    approved_on = Column(DateTime, nullable=True)
    approved_by = Column(String, ForeignKey("users.id"), nullable=True)
    
    # Relationships
    user = relationship("User", foreign_keys=[user_id], back_populates="leave_applications")
    leave_type = relationship("LeaveType", back_populates="leave_applications")
    approver = relationship("User", foreign_keys=[approved_by])

 

class Notification(Base):
    __tablename__ = "notifications"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    type = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    related_leave_id = Column(String, ForeignKey("leave_applications.id"), nullable=True)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="notifications")


# =============== TIMESHEET MODELS ===============


class TimesheetEntry(Base):
    __tablename__ = "timesheet_entries"
    
    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    date = Column(Date, nullable=False, index=True)
    start_time = Column(String, nullable=True)
    end_time = Column(String, nullable=True)
    hours_logged = Column(Integer, nullable=True)
    description = Column(Text, nullable=True)
    status = Column(String, default="pending")
    is_absent = Column(Boolean, default=False)
    is_locked = Column(Boolean, default=False)
    locked_at = Column(DateTime, nullable=True)
    locked_by = Column(String, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", foreign_keys=[user_id])
    locker = relationship("User", foreign_keys=[locked_by])



class TimesheetActivity(Base):
    __tablename__ = "timesheet_activities"
    
    id = Column(String, primary_key=True)
    timesheet_id = Column(String, ForeignKey("timesheet_entries.id"), nullable=False, index=True)
    slot = Column(String, nullable=True)
    description = Column(String, nullable=False)
    output = Column(Text, nullable=True)
    start_time = Column(String, nullable=True)
    end_time = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    timesheet = relationship("TimesheetEntry", backref="activities")



class TimesheetLockPolicy(Base):
    __tablename__ = "timesheet_lock_policies"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    lock_after_days = Column(Integer, default=2)
    lock_time = Column(String, default="23:59")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)



class TimesheetUnlockRequest(Base):
    __tablename__ = "timesheet_unlock_requests"
    
    id = Column(String, primary_key=True)
    timesheet_id = Column(String, ForeignKey("timesheet_entries.id"), nullable=False, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    date = Column(Date, nullable=False)
    reason = Column(Text, nullable=False)
    status = Column(String, default="pending", index=True)
    approved_by = Column(String, ForeignKey("users.id"), nullable=True)
    approved_on = Column(DateTime, nullable=True)
    remarks = Column(Text, nullable=True)
    requested_on = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    timesheet = relationship("TimesheetEntry")
    requester = relationship("User", foreign_keys=[user_id])
    approver = relationship("User", foreign_keys=[approved_by])


class UserCreationRequest(Base):
    __tablename__ = "user_creation_requests"
    
    id = Column(String, primary_key=True)
    requested_by = Column(String, ForeignKey('users.id'), nullable=False)
    requested_by_name = Column(String, nullable=False)
    
    # User details
    name = Column(String, nullable=False)
    email = Column(String, nullable=False)
    role = Column(String, nullable=False)
    department = Column(String)
    designation = Column(String)
    supervisor_id = Column(String, ForeignKey('users.id'))
    join_date = Column(Date)    
    employment_type = Column(String(20)) 
    
    # Approval workflow
    status = Column(String, default='pending')
    approver_id = Column(String, ForeignKey('users.id'))
    approver_name = Column(String)
    approved_on = Column(DateTime)
    rejection_remarks = Column(Text)
    
    # Audit
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class UserDeletionRequest(Base):
    __tablename__ = "user_deletion_requests"
    
    id = Column(String, primary_key=True)
    requested_by = Column(String, ForeignKey('users.id'), nullable=False)
    requested_by_name = Column(String, nullable=False)
    
    # User to be deleted - NO FOREIGN KEY to prevent cascade deletion
    user_id = Column(String, nullable=False)  # Removed ForeignKey
    user_name = Column(String, nullable=False)
    user_email = Column(String, nullable=False)
    reason = Column(Text, nullable=True)
    
    # Approval workflow
    status = Column(String, default='pending')
    approver_id = Column(String, ForeignKey('users.id'))
    approver_name = Column(String)
    approved_on = Column(DateTime)
    rejection_remarks = Column(Text)
    
    # Audit
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# Create all tables
def init_db():
    Base.metadata.create_all(bind=engine)
    print("✅ Database tables created successfully!")
