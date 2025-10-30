from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from database import get_db, User
from config import settings

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# HTTP Bearer token scheme
security = HTTPBearer()

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
        # Regular employees
        "Employee": [
            "apply_leave", 
            "view_own_balance", 
            "view_own_history"
        ],
        
        # Managers, Team Leads, etc. - can approve team leaves
        "Manager": [
            "apply_leave", 
            "view_own_balance", 
            "view_own_history", 
            "approve_team_leaves", 
            "view_team"
        ],
        
        "Team Lead": [
            "apply_leave", 
            "view_own_balance", 
            "view_own_history", 
            "approve_team_leaves", 
            "view_team"
        ],
        
        # Senior management - can approve all leaves
        "CEO": [
            "apply_leave", 
            "view_own_balance", 
            "view_own_history", 
            "approve_team_leaves", 
            "view_team",
            "view_all_leaves"
        ],
        
        "Founder": [
            "apply_leave", 
            "view_own_balance", 
            "view_own_history", 
            "approve_team_leaves", 
            "view_team",
            "view_all_leaves"
        ],
        
        # HR - full access
        "HR": [
            "apply_leave", 
            "view_own_balance", 
            "view_own_history", 
            "approve_team_leaves", 
            "view_team", 
            "manage_hr", 
            "manage_policies", 
            "view_all_leaves"
        ]
    }
    return permissions.get(role, [])  # Return empty list if role not found

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
