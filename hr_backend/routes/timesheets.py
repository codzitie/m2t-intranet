from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_
from datetime import datetime, date, timedelta
from database import get_db, User, TimesheetEntry, TimesheetActivity, TimesheetUnlockRequest, Notification
from auth import get_current_user, require_permission
import uuid

router = APIRouter(prefix="/api/timesheets", tags=["timesheets"])

# ============= HELPER FUNCTIONS =============

def time_to_minutes(time_str: str) -> int:
    """Convert HH:MM to minutes"""
    try:
        hours, minutes = map(int, time_str.split(':'))
        return hours * 60 + minutes
    except:
        return 0

def minutes_to_hours(minutes: int) -> float:
    """Convert minutes to hours (e.g., 510 -> 8.5)"""
    return minutes / 60 if minutes else 0

def validate_timesheet_hours(hours: float) -> bool:
    """Validate if hours is within 7-8.5 range"""
    return 7 <= hours <= 8.5

def auto_lock_old_entries(entries, today):
    """✅ AUTO-LOCK entries older than 2 days with no data"""
    for entry in entries:
        # Lock if: older than 2 days + no hours logged + status is pending
        if (entry.date < (today - timedelta(days=2)) and 
            not entry.hours_logged and 
            entry.status == "pending"):
            entry.is_locked = True
    return entries

# ============= CREATE TIMESHEET ENTRY =============

@router.post("/", response_model=dict, status_code=status.HTTP_201_CREATED)
def create_timesheet(
    timesheet_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create or update timesheet entry for current user
    - Min 7 hours, Max 8.5 hours
    - Cannot edit locked entries
    """
    
    entry_date = date.fromisoformat(timesheet_data.get("date"))
    start_time = timesheet_data.get("start_time")
    end_time = timesheet_data.get("end_time")
    description = timesheet_data.get("description")
    activities = timesheet_data.get("activities", [])
    
    # Check if entry already exists for this date
    existing = db.query(TimesheetEntry).filter(
        TimesheetEntry.user_id == current_user.id,
        TimesheetEntry.date == entry_date
    ).first()
    
    if existing and existing.is_locked:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This timesheet entry is locked. Request unlock if needed."
        )
    
    # Calculate hours
    start_min = time_to_minutes(start_time)
    end_min = time_to_minutes(end_time)
    
    if end_min < start_min:
        end_min += 24 * 60
    
    hours_minutes = end_min - start_min
    hours = minutes_to_hours(hours_minutes)
    
    # Validate hours
    if not validate_timesheet_hours(hours):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Hours must be between 7 and 8.5. You entered {hours}h"
        )
    
    # Update or create entry
    if existing:
        existing.start_time = start_time
        existing.end_time = end_time
        existing.hours_logged = hours_minutes
        existing.description = description
        existing.status = "filled"
        existing.is_locked = False  # ✅ UNLOCK when filling
        existing.updated_at = datetime.utcnow()
        entry = existing
    else:
        entry = TimesheetEntry(
            id=str(uuid.uuid4()),
            user_id=current_user.id,
            date=entry_date,
            start_time=start_time,
            end_time=end_time,
            hours_logged=hours_minutes,
            description=description,
            status="filled"
        )
        db.add(entry)
    
    # Handle activities
    if activities:
        if existing:
            db.query(TimesheetActivity).filter(
                TimesheetActivity.timesheet_id == entry.id
            ).delete()
        
        for activity in activities:
            new_activity = TimesheetActivity(
                id=str(uuid.uuid4()),
                timesheet_id=entry.id,
                slot=activity.get("slot"),
                description=activity.get("description"),
                output=activity.get("output"),
                start_time=activity.get("start_time"),
                end_time=activity.get("end_time")
            )
            db.add(new_activity)
    
    db.commit()
    db.refresh(entry)
    
    return {
        "id": entry.id,
        "user_id": entry.user_id,
        "date": str(entry.date),
        "start_time": entry.start_time,
        "end_time": entry.end_time,
        "hours_logged": minutes_to_hours(entry.hours_logged) if entry.hours_logged else 0,
        "description": entry.description,
        "status": entry.status,
        "is_locked": entry.is_locked,
        "message": "Timesheet entry saved successfully"
    }

# ============= GET TIMESHEET FOR MONTH =============

@router.get("/month/{year}/{month}")
def get_month_timesheets(
    year: int,
    month: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all timesheet entries for a specific month with auto-locking"""
    
    start_date = date(year, month, 1)
    if month == 12:
        end_date = date(year + 1, 1, 1) - timedelta(days=1)
    else:
        end_date = date(year, month + 1, 1) - timedelta(days=1)
    
    today = date.today()
    
    entries = db.query(TimesheetEntry).filter(
        TimesheetEntry.user_id == current_user.id,
        TimesheetEntry.date >= start_date,
        TimesheetEntry.date <= end_date
    ).order_by(TimesheetEntry.date).all()
    
    # ✅ AUTO-LOCK OLD ENTRIES
    entries = auto_lock_old_entries(entries, today)
    
    result = []
    for entry in entries:
        result.append({
            "id": entry.id,
            "date": str(entry.date),
            "start_time": entry.start_time,
            "end_time": entry.end_time,
            "hours_logged": minutes_to_hours(entry.hours_logged) if entry.hours_logged else 0,
            "description": entry.description,
            "status": entry.status,
            "is_locked": entry.is_locked,  # ✅ NOW RETURNS LOCKED STATUS
            "is_absent": entry.is_absent,
            "activities": [
                {
                    "id": a.id,
                    "slot": a.slot,
                    "description": a.description,
                    "output": a.output,
                    "start_time": a.start_time,
                    "end_time": a.end_time
                }
                for a in entry.activities
            ] if entry.activities else []
        })
    
    return result

# ============= GET TIMESHEET STATS =============

@router.get("/stats/{year}/{month}")
def get_timesheet_stats(
    year: int,
    month: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get timesheet statistics for current month with auto-locking logic"""
    
    start_date = date(year, month, 1)
    if month == 12:
        end_date = date(year + 1, 1, 1) - timedelta(days=1)
    else:
        end_date = date(year, month + 1, 1) - timedelta(days=1)
    
    today = date.today()
    two_days_ago = today - timedelta(days=2)
    
    entries = db.query(TimesheetEntry).filter(
        TimesheetEntry.user_id == current_user.id,
        TimesheetEntry.date >= start_date,
        TimesheetEntry.date <= end_date
    ).all()
    
    # ✅ AUTO-LOCK LOGIC: Entries older than 2 days with no data
    for entry in entries:
        if (entry.date < two_days_ago and 
            not entry.hours_logged and 
            entry.status == "pending"):
            entry.is_locked = True
    
    # ✅ COMMIT CHANGES (save to DB)
    db.commit()
    
    filled = 0
    pending = 0
    locked = 0
    absent = 0
    total = 0
    
    for e in entries:
        # ✅ Python weekday(): 6 = Sunday, 0-5 = Mon-Sat
        if e.date.weekday() == 6:
            continue
        
        # Only count past/today
        if e.date > today:
            continue
        
        total += 1
        
        if e.is_absent:
            absent += 1
        elif e.is_locked:
            locked += 1
        elif e.status == "filled" or e.hours_logged:
            filled += 1
        else:
            pending += 1
    
    total_hours = sum(e.hours_logged or 0 for e in entries)
    total_hours_formatted = minutes_to_hours(total_hours)
    
    return {
        "filled_days": filled,
        "pending_days": pending,
        "locked_days": locked,
        "absent_days": absent,
        "total_days": total,
        "total_hours": round(total_hours_formatted, 2)
    }

    


# ============= GET EMPLOYEE TIMESHEETS (Manager/HR) =============

@router.get("/employee/{employee_id}/month/{year}/{month}")
def get_employee_month_timesheets(
    employee_id: str,
    year: int,
    month: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("approve_team_leaves"))
):
    """Get timesheet entries for team member (Manager/HR only)"""
    
    employee = db.query(User).filter(User.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    if current_user.role == "Manager" and employee.supervisor_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view your team members' timesheets"
        )
    
    start_date = date(year, month, 1)
    if month == 12:
        end_date = date(year + 1, 1, 1) - timedelta(days=1)
    else:
        end_date = date(year, month + 1, 1) - timedelta(days=1)
    
    today = date.today()
    
    entries = db.query(TimesheetEntry).filter(
        TimesheetEntry.user_id == employee_id,
        TimesheetEntry.date >= start_date,
        TimesheetEntry.date <= end_date
    ).order_by(TimesheetEntry.date).all()
    
    # ✅ AUTO-LOCK OLD ENTRIES
    entries = auto_lock_old_entries(entries, today)
    
    result = []
    for entry in entries:
        result.append({
            "id": entry.id,
            "employee_name": employee.name,
            "date": str(entry.date),
            "start_time": entry.start_time,
            "end_time": entry.end_time,
            "hours_logged": minutes_to_hours(entry.hours_logged) if entry.hours_logged else 0,
            "description": entry.description,
            "status": entry.status,
            "is_locked": entry.is_locked
        })
    
    return result

# ============= UNLOCK REQUEST =============

@router.post("/unlock-request", response_model=dict, status_code=status.HTTP_201_CREATED)
def request_unlock(
    request_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Request to unlock a locked timesheet"""
    
    timesheet_id = request_data.get("timesheet_id")
    unlock_date = date.fromisoformat(request_data.get("date"))
    reason = request_data.get("reason")
    
    timesheet = db.query(TimesheetEntry).filter(
        TimesheetEntry.id == timesheet_id
    ).first()
    
    if not timesheet:
        raise HTTPException(status_code=404, detail="Timesheet not found")
    
    if not timesheet.is_locked:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This timesheet is not locked"
        )
    
    existing_request = db.query(TimesheetUnlockRequest).filter(
        TimesheetUnlockRequest.timesheet_id == timesheet_id,
        TimesheetUnlockRequest.status == "pending"
    ).first()
    
    if existing_request:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unlock request already pending for this date"
        )
    
    unlock_req = TimesheetUnlockRequest(
        id=str(uuid.uuid4()),
        timesheet_id=timesheet_id,
        user_id=current_user.id,
        date=unlock_date,
        reason=reason
    )
    
    db.add(unlock_req)
    
    if current_user.supervisor_id:
        notification = Notification(
            user_id=current_user.supervisor_id,
            type="unlock_requested",
            message=f"{current_user.name} requested unlock for timesheet on {unlock_date}",
            related_leave_id=None
        )
        db.add(notification)
    
    db.commit()
    db.refresh(unlock_req)
    
    return {
        "id": unlock_req.id,
        "timesheet_id": unlock_req.timesheet_id,
        "date": str(unlock_req.date),
        "reason": unlock_req.reason,
        "status": unlock_req.status,
        "message": "Unlock request submitted successfully"
    }

# ============= GET PENDING UNLOCK REQUESTS (HR) =============

@router.get("/unlock-requests/pending")
def get_pending_unlock_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("manage_hr"))
):
    """Get all pending unlock requests (HR only)"""
    
    requests = db.query(TimesheetUnlockRequest).filter(
        TimesheetUnlockRequest.status == "pending"
    ).order_by(TimesheetUnlockRequest.requested_on.desc()).all()
    
    result = []
    for req in requests:
        user = db.query(User).filter(User.id == req.user_id).first()
        result.append({
            "id": req.id,
            "timesheet_id": req.timesheet_id,
            "employee_name": user.name if user else "Unknown",
            "employee_id": req.user_id,
            "date": str(req.date),
            "reason": req.reason,
            "status": req.status,
            "requested_on": str(req.requested_on)
        })
    
    return result

# ============= APPROVE/REJECT UNLOCK REQUEST =============

@router.put("/unlock-requests/{request_id}")
def approve_unlock_request(
    request_id: str,
    approval_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("manage_hr"))
):
    """Approve or reject unlock request (HR only)"""
    
    unlock_req = db.query(TimesheetUnlockRequest).filter(
        TimesheetUnlockRequest.id == request_id
    ).first()
    
    if not unlock_req:
        raise HTTPException(status_code=404, detail="Request not found")
    
    unlock_req.status = approval_data.get("status")
    unlock_req.approved_by = current_user.id
    unlock_req.approved_on = datetime.utcnow()
    unlock_req.remarks = approval_data.get("remarks", "")
    
    if approval_data.get("status") == "approved":
        timesheet = db.query(TimesheetEntry).filter(
            TimesheetEntry.id == unlock_req.timesheet_id
        ).first()
        if timesheet:
            timesheet.is_locked = False
            timesheet.status = "pending"  # ✅ RESET TO PENDING FOR EDITING
    
    employee = db.query(User).filter(User.id == unlock_req.user_id).first()
    status_msg = "approved" if approval_data.get("status") == "approved" else "rejected"
    notification = Notification(
        user_id=unlock_req.user_id,
        type="unlock_request_" + status_msg,
        message=f"Your unlock request for {unlock_req.date} has been {status_msg}",
        related_leave_id=None
    )
    db.add(notification)
    
    db.commit()
    db.refresh(unlock_req)
    
    return {
        "id": unlock_req.id,
        "status": unlock_req.status,
        "approved_on": str(unlock_req.approved_on),
        "message": f"Unlock request {status_msg} successfully"
    }

# ============= HR TIMESHEET DASHBOARD =============

@router.get("/hr/dashboard")
def get_hr_timesheet_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("manage_hr"))
):
    """Get HR timesheet dashboard (HR only)"""
    
    today = date.today()
    month_start = date(today.year, today.month, 1)
    
    all_users = db.query(User).filter(User.role == "Employee").all()
    
    stats = {
        "total_employees": len(all_users),
        "today_filled": 0,
        "today_pending": 0,
        "today_absent": 0,
        "pending_unlocks": 0,
        "month_summary": {}
    }
    
    today_entries = db.query(TimesheetEntry).filter(
        TimesheetEntry.date == today
    ).all()
    
    stats["today_filled"] = len([e for e in today_entries if e.status == "filled"])
    stats["today_pending"] = len([e for e in today_entries if e.status == "pending" and not e.is_locked])
    stats["today_absent"] = len([e for e in today_entries if e.is_absent])
    
    stats["pending_unlocks"] = db.query(TimesheetUnlockRequest).filter(
        TimesheetUnlockRequest.status == "pending"
    ).count()
    
    for user in all_users:
        month_entries = db.query(TimesheetEntry).filter(
            TimesheetEntry.user_id == user.id,
            TimesheetEntry.date >= month_start,
            TimesheetEntry.date <= today
        ).all()
        
        # ✅ AUTO-LOCK OLD ENTRIES
        month_entries = auto_lock_old_entries(month_entries, today)
        
        filled = len([e for e in month_entries if e.status == "filled"])
        pending = len([e for e in month_entries if e.status == "pending" and not e.is_locked])
        locked = len([e for e in month_entries if e.is_locked])
        
        stats["month_summary"][user.name] = {
            "filled": filled,
            "pending": pending,
            "locked": locked,
            "total_hours": round(minutes_to_hours(sum(e.hours_logged or 0 for e in month_entries)), 2)
        }
    
    return stats
