from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status, APIRouter
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from database import get_db, User
from config import settings
import random
import string
from email_service import send_otp_email
from email_service import send_password_reset_otp
# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# HTTP Bearer token scheme
security = HTTPBearer()

# Router for auth endpoints
router = APIRouter(prefix="/api/auth", tags=["Authentication"])

# Hash password
def hash_password(password: str) -> str:
    """Convert plain password to hashed password"""
    return pwd_context.hash(password)

# Verify password
def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Check if plain password matches hashed password"""
    return pwd_context.verify(plain_password, hashed_password)

# Create JWT access token
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Generate JWT token for authenticated user"""
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

# Decode and verify JWT token
def decode_access_token(token: str) -> dict:
    """Decode JWT token and return payload"""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

# Get current user from token
def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """Get current logged-in user from JWT token"""
    
    token = credentials.credentials
    payload = decode_access_token(token)
    
    user_id: str = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        )
    
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )
    
    return user

# Get user permissions based on role
def get_user_permissions(role: str) -> list:
    """Return list of permissions based on user role"""
    permissions = {
        "Employee": [
            "apply_leave", "view_own_balance", "view_own_history",
            "fill_timesheet", "view_own_timesheet",
        ],
        "Manager": [
            "apply_leave", "view_own_balance", "view_own_history", 
            "approve_team_leaves", "view_team",
            "fill_timesheet", "view_own_timesheet", "view_team_timesheet",
        ],
        "Team Lead": [
            "apply_leave", "view_own_balance", "view_own_history", 
            "approve_team_leaves", "view_team",
            "fill_timesheet", "view_own_timesheet", "view_team_timesheet",
        ],
        "CEO": [
            "apply_leave", "view_own_balance", "view_own_history", 
            "approve_team_leaves", "view_team", "view_all_leaves",
            "fill_timesheet", "view_own_timesheet", "view_all_timesheets","manage_hr",
        ],
        "Founder": [
            "apply_leave", "view_own_balance", "view_own_history", 
            "approve_team_leaves", "view_team", "view_all_leaves",
            "fill_timesheet", "view_own_timesheet", "view_all_timesheets","manage_hr",
        ],
        "HR": [
            "apply_leave", "view_own_balance", "view_own_history", 
            "approve_team_leaves", "view_team", "manage_hr", 
            "manage_policies", "view_all_leaves",
            "fill_timesheet", "view_own_timesheet", "view_all_timesheets",
            "lock_timesheet", "approve_unlock_requests",
        ]
    }   
    return permissions.get(role, [])

# Check if user has specific permission
def require_permission(permission: str):
    """Decorator to check if user has required permission"""
    def permission_checker(current_user: User = Depends(get_current_user)):
        user_permissions = get_user_permissions(current_user.role)
        if permission not in user_permissions:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission denied. Required: {permission}"
            )
        return current_user
    return permission_checker

# ============= OTP HELPER FUNCTIONS =============

def generate_otp() -> str:
    """Generate 6-digit OTP"""
    return ''.join(random.choices(string.digits, k=6))

# ============= OTP LOGIN ENDPOINTS =============

@router.post("/login-otp")
def login_with_otp(login_data: dict, db: Session = Depends(get_db)):
    """STEP 1: Verify email + password, send OTP"""
    email = login_data.get("email", "").lower().strip()
    password = login_data.get("password", "")
    
    if not email or not password:
        raise HTTPException(status_code=400, detail="Email and password are required")
    
    user = db.query(User).filter(User.email == email).first()
    if not user or not verify_password(password, user.password_hash):  # ✅ FIXED: password_hash
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    otp = generate_otp()
    user.two_fa_code = otp
    user.two_fa_code_expires = datetime.utcnow() + timedelta(minutes=5)
    db.commit()
    
    send_otp_email(user.email, otp, user.name)
    
    return {"message": "OTP sent to your email", "email": user.email, "requires_otp": True}

@router.post("/verify-otp")
def verify_otp(verify_data: dict, db: Session = Depends(get_db)):
    """STEP 2: Verify OTP and return JWT token"""
    email = verify_data.get("email", "").lower().strip()
    otp = verify_data.get("otp", "").strip()
    
    if not email or not otp:
        raise HTTPException(status_code=400, detail="Email and OTP are required")
    
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    if not user.two_fa_code:
        raise HTTPException(status_code=400, detail="No OTP found. Please request a new one.")
    
    if datetime.utcnow() > user.two_fa_code_expires:
        user.two_fa_code = None
        user.two_fa_code_expires = None
        db.commit()
        raise HTTPException(status_code=400, detail="OTP expired. Please request a new one.")
    
    if user.two_fa_code != otp:
        raise HTTPException(status_code=401, detail="Invalid OTP code")
    
    # ✅ Store the PREVIOUS last_login before updating
    previous_last_login = user.last_login
    
    # ✅ Update prev_login to previous last_login
    user.prev_login = previous_last_login
    
    # ✅ Update last_login to current time
    user.last_login = datetime.utcnow()
    
    # Clear OTP codes
    user.two_fa_code = None
    user.two_fa_code_expires = None
    db.commit()
    
    token_data = {"sub": user.id}
    access_token = create_access_token(token_data)
    
    # ✅ Return user data WITH last_login as previous login time
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "designation": user.designation,
            "permissions": get_user_permissions(user.role),
            "last_login": previous_last_login.isoformat() if previous_last_login else None,
            "prev_login": previous_last_login.isoformat() if previous_last_login else None
        }
    }




@router.post("/resend-otp")
def resend_otp(resend_data: dict, db: Session = Depends(get_db)):
    """RESEND OTP"""
    email = resend_data.get("email", "").lower().strip()
    
    if not email:
        raise HTTPException(status_code=400, detail="Email is required")
    
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    otp = generate_otp()
    user.two_fa_code = otp
    user.two_fa_code_expires = datetime.utcnow() + timedelta(minutes=5)
    db.commit()
    
    send_otp_email(user.email, otp, user.name)
    
    return {"message": "New OTP sent to your email", "email": user.email}




# ============= FORGOT PASSWORD ENDPOINTS =============

@router.post("/forgot-password")
def forgot_password(request_data: dict, db: Session = Depends(get_db)):
    """
    STEP 1: Request password reset - Sends OTP to email
    """
    email = request_data.get("email", "").lower().strip()
    
    if not email:
        raise HTTPException(status_code=400, detail="Email is required")
    
    user = db.query(User).filter(User.email == email).first()
    if not user:
        # ✅ Don't reveal if email exists (security best practice)
        return {
            "message": "If this email exists, you will receive a password reset code",
            "email": email
        }
    
    # Generate OTP for password reset
    otp = generate_otp()
    user.two_fa_code = otp
    user.two_fa_code_expires = datetime.utcnow() + timedelta(minutes=10)  # 10 min expiry
    db.commit()
    
    # Send password reset OTP email
    send_password_reset_otp(user.email, otp, user.name)
    
    return {
        "message": "Password reset code sent to your email",
        "email": user.email
    }


@router.post("/verify-reset-otp")
def verify_reset_otp(verify_data: dict, db: Session = Depends(get_db)):
    """
    STEP 2: Verify OTP for password reset
    """
    email = verify_data.get("email", "").lower().strip()
    otp = verify_data.get("otp", "").strip()
    
    if not email or not otp:
        raise HTTPException(status_code=400, detail="Email and OTP are required")
    
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    if not user.two_fa_code:
        raise HTTPException(status_code=400, detail="No OTP found. Please request a new one.")
    
    if datetime.utcnow() > user.two_fa_code_expires:
        user.two_fa_code = None
        user.two_fa_code_expires = None
        db.commit()
        raise HTTPException(status_code=400, detail="OTP expired. Please request a new one.")
    
    if user.two_fa_code != otp:
        raise HTTPException(status_code=401, detail="Invalid OTP code")
    
    # ✅ OTP verified - allow password reset
    return {
        "message": "OTP verified successfully. You can now reset your password.",
        "email": user.email,
        "verified": True
    }


@router.post("/reset-password")
def reset_password(reset_data: dict, db: Session = Depends(get_db)):
    """
    STEP 3: Reset password after OTP verification
    """
    email = reset_data.get("email", "").lower().strip()
    otp = reset_data.get("otp", "").strip()
    new_password = reset_data.get("new_password", "")
    
    if not email or not otp or not new_password:
        raise HTTPException(
            status_code=400, 
            detail="Email, OTP, and new password are required"
        )
    
    # Validate password strength
    if len(new_password) < 8:
        raise HTTPException(
            status_code=400, 
            detail="Password must be at least 8 characters long"
        )
    
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    # Verify OTP one more time
    if not user.two_fa_code or user.two_fa_code != otp:
        raise HTTPException(status_code=401, detail="Invalid or expired OTP")
    
    if datetime.utcnow() > user.two_fa_code_expires:
        user.two_fa_code = None
        user.two_fa_code_expires = None
        db.commit()
        raise HTTPException(status_code=400, detail="OTP expired. Please start over.")
    
    # ✅ Update password
    user.password_hash = hash_password(new_password)
    
    # Clear OTP after successful reset
    user.two_fa_code = None
    user.two_fa_code_expires = None
    
    db.commit()
    
    return {
        "message": "Password reset successful. You can now login with your new password.",
        "email": user.email
    }
