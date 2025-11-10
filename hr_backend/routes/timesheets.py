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
        print(f"🔄 UPDATING existing entry for {entry_date}")  # ✅ DEBUG LOG
        existing.start_time = start_time
        existing.end_time = end_time
        existing.hours_logged = hours_minutes
        existing.description = description
        existing.status = "filled"
        existing.is_locked = False
        existing.updated_at = datetime.utcnow()
        entry = existing
    else:
        print(f"✅ CREATING new entry for {entry_date}")  # ✅ DEBUG LOG
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
    
    # ✅ DELETE OLD ACTIVITIES IF UPDATING
    if existing:
        db.query(TimesheetActivity).filter(
            TimesheetActivity.timesheet_id == entry.id
        ).delete()
    
    # Handle activities
    activities_list = []
    if activities:
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
            activities_list.append(new_activity)
    
    db.commit()
    db.refresh(entry)
    
    # ✅ RETURN ACTIVITIES IN RESPONSE
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
        "activities": [  # ✅ ADDED THIS
            {
                "id": a.id,
                "slot": a.slot,
                "description": a.description,
                "output": a.output,
                "start_time": a.start_time,
                "end_time": a.end_time
            }
            for a in activities_list
        ],
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
            "hours_logged": entry.hours_logged if entry.hours_logged else 0,
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

# ============= GET TIMESHEET STATS =============

@router.get("/stats/{year}/{month}")
def get_timesheet_stats(
    year: int,
    month: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get timesheet statistics with auto-lock logic"""
    
    start_date = date(year, month, 1)
    if month == 12:
        end_date = date(year + 1, 1, 1) - timedelta(days=1)
    else:
        end_date = date(year, month + 1, 1) - timedelta(days=1)
    
    today = date.today()
    yesterday = today - timedelta(days=1)
    
    entries = db.query(TimesheetEntry).filter(
        TimesheetEntry.user_id == current_user.id,
        TimesheetEntry.date >= start_date,
        TimesheetEntry.date <= end_date
    ).all()
    
    filled = 0
    pending = 0
    locked = 0
    absent = 0
    total = 0
    
    for e in entries:
        # ✅ Skip weekends
        if e.date.weekday() == 6:
            continue
        
        # ✅ Only count past/today
        if e.date > today:
            continue
        
        total += 1
        
        if e.is_absent:
            absent += 1
        elif e.is_locked:
            # ✅ COUNT ACTUAL DB LOCKED
            locked += 1
        elif e.status == "filled" or e.hours_logged:
            filled += 1
        else:
            # ✅ AUTO-LOCK LOGIC: Entries older than yesterday with no data
            if e.date < yesterday and not e.hours_logged:
                locked += 1
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
    
    entries = db.query(TimesheetEntry).filter(
        TimesheetEntry.user_id == employee_id,
        TimesheetEntry.date >= start_date,
        TimesheetEntry.date <= end_date
    ).order_by(TimesheetEntry.date).all()
    
    # ❌ REMOVED AUTO-LOCK - Just return DB values
    
    result = []
    for entry in entries:
        activities_list = []
        if entry.activities:
            for activity in entry.activities:
                activities_list.append({
                    "id": activity.id,
                    "slot": activity.slot,
                    "description": activity.description,
                    "output": activity.output,
                    "start_time": activity.start_time,
                    "end_time": activity.end_time
                })
        
        result.append({
            "id": entry.id,
            "employee_name": employee.name,
            "date": str(entry.date),
            "start_time": entry.start_time,
            "end_time": entry.end_time,
            "hours_logged": entry.hours_logged,
            "description": entry.description,
            "status": entry.status,
            "is_locked": entry.is_locked,  # ✅ RETURNS ACTUAL DB VALUE
            "activities": activities_list
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

# ============= HR TIMESHEET DASHBOARD =============

@router.get("/hr/dashboard")
def get_hr_timesheet_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("manage_hr"))
):
    """Get HR timesheet dashboard (HR only) - STRICT DB LOCK COUNT"""
    
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
        
        # ✅ STRICT COUNT - ONLY DB LOCKED ENTRIES
        filled = 0
        pending = 0
        locked = 0
        
        for e in month_entries:
            # Skip weekends
            if e.date.weekday() == 6:
                continue
            
            # Skip future dates
            if e.date > today:
                continue
            
            # ✅ ONLY COUNT ACTUAL DB LOCKED (NO AUTO-LOCK LOGIC)
            if e.is_locked:
                locked += 1
            elif e.status == "filled" or e.hours_logged:
                filled += 1
            else:
                pending += 1
        
        stats["month_summary"][user.name] = {
            "filled": filled,
            "pending": pending,
            "locked": locked,  # ✅ NOW ONLY COUNTS DB LOCKED
            "total_hours": round(minutes_to_hours(sum(e.hours_logged or 0 for e in month_entries)), 2)
        }
    
    return stats


@router.post("/activities", status_code=status.HTTP_201_CREATED)
def create_standalone_activity(
    activity_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create/update standalone activity
    - If timesheet entry exists for date, append activity
    - If not, create new pending entry and append activity
    """
    
    date_str = activity_data.get("date")
    entry_date = date.fromisoformat(date_str)
    
    # ✅ Get or create timesheet entry for this date
    entry = db.query(TimesheetEntry).filter(
        TimesheetEntry.user_id == current_user.id,
        TimesheetEntry.date == entry_date
    ).first()
    
    if not entry:
        # ✅ Create minimal pending entry
        entry = TimesheetEntry(
            id=str(uuid.uuid4()),
            user_id=current_user.id,
            date=entry_date,
            status="pending",
            start_time=None,
            end_time=None
        )
        db.add(entry)
        db.flush()
    
    # ✅ Create activity
    activity = TimesheetActivity(
        id=str(uuid.uuid4()),
        timesheet_id=entry.id,
        slot=activity_data.get("slot"),
        description=activity_data.get("description"),
        output=activity_data.get("output"),
        start_time=activity_data.get("start_time"),
        end_time=activity_data.get("end_time")
    )
    
    db.add(activity)
    db.commit()
    db.refresh(activity)
    
    return {
        "id": activity.id,
        "timesheet_id": entry.id,
        "slot": activity.slot,
        "description": activity.description,
        "output": activity.output,
        "start_time": activity.start_time,
        "end_time": activity.end_time,
        "message": "Activity saved successfully"
    }


@router.get("/activities/{date_str}")
def get_activities_by_date(
    date_str: str,  # ✅ RENAMED from 'date' to 'date_str'
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all activities for a specific date"""
    
    # ✅ NOW THIS WORKS
    entry_date = date.fromisoformat(date_str)
    
    entry = db.query(TimesheetEntry).filter(
        TimesheetEntry.user_id == current_user.id,
        TimesheetEntry.date == entry_date
    ).first()
    
    if not entry:
        return []
    
    activities = db.query(TimesheetActivity).filter(
        TimesheetActivity.timesheet_id == entry.id
    ).all()
    
    return [
        {
            "id": a.id,
            "date": str(entry.date),
            "slot": a.slot,
            "description": a.description,
            "output": a.output,
            "start_time": a.start_time,
            "end_time": a.end_time
        }
        for a in activities
    ]


@router.put("/activities/{activity_id}")
def update_activity(
    activity_id: str,
    activity_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update an existing activity"""
    
    activity = db.query(TimesheetActivity).filter(
        TimesheetActivity.id == activity_id
    ).first()
    
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    
    # ✅ Update fields
    activity.slot = activity_data.get("slot", activity.slot)
    activity.description = activity_data.get("description", activity.description)
    activity.output = activity_data.get("output", activity.output)
    activity.start_time = activity_data.get("start_time", activity.start_time)
    activity.end_time = activity_data.get("end_time", activity.end_time)
    
    db.commit()
    db.refresh(activity)
    
    return {
        "id": activity.id,
        "message": "Activity updated successfully"
    }


@router.delete("/activities/{activity_id}")
def delete_activity(
    activity_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete an activity"""
    
    activity = db.query(TimesheetActivity).filter(
        TimesheetActivity.id == activity_id
    ).first()
    
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    
    db.delete(activity)
    db.commit()
    
    return {"message": "Activity deleted successfully"}




# ============= GET TEAM MEMBERS' TIMESHEETS (Manager Only) =============

@router.get("/team/{year}/{month}")
def get_team_timesheets(
    year: int,
    month: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    ✅ GET ALL TEAM MEMBERS' TIMESHEETS
    - Managers, Team Leads, and above can access
    - Returns timesheets for all employees reporting to this user
    """
    
    # ✅ ALLOW MULTIPLE ROLES
    ALLOWED_ROLES = ['Manager', 'Team Lead', 'CEO', 'Founder', 'HR']
    
    if current_user.role not in ALLOWED_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Only {', '.join(ALLOWED_ROLES)} can access team timesheets"
        )
    
    # ✅ GET ALL EMPLOYEES REPORTING TO THIS USER
    team_members = db.query(User).filter(
        User.supervisor_id == current_user.id
    ).all()
    
    if not team_members:
        return []
    
    # ✅ GET FIRST AND LAST DAY OF MONTH
    start_date = date(year, month, 1)
    if month == 12:
        end_date = date(year + 1, 1, 1) - timedelta(days=1)
    else:
        end_date = date(year, month + 1, 1) - timedelta(days=1)
    
    # ✅ GET TIMESHEETS FOR ALL TEAM MEMBERS
    result = []
    
    for member in team_members:
        entries = db.query(TimesheetEntry).filter(
            TimesheetEntry.user_id == member.id,
            TimesheetEntry.date >= start_date,
            TimesheetEntry.date <= end_date
        ).all()
        
        result.append({
            "user_id": member.id,
            "name": member.name,
            "email": member.email,
            "designation": member.designation,
            "entries": [
                {
                    "id": entry.id,
                    "date": str(entry.date),
                    "status": entry.status,
                    "is_locked": entry.is_locked,
                    "start_time": entry.start_time,
                    "end_time": entry.end_time,
                    "hours_logged": minutes_to_hours(entry.hours_logged) if entry.hours_logged else 0,
                    "description": entry.description,
                    "activities": [
                        {
                            "id": activity.id,
                            "slot": activity.slot,
                            "description": activity.description,
                            "output": activity.output,
                            "start_time": activity.start_time,
                            "end_time": activity.end_time
                        }
                        for activity in entry.activities
                    ] if entry.activities else []
                }
                for entry in entries
            ]
        })
    
    return result


@router.get("/hr/today-status")
def get_today_status_all_employees(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("manage_hr"))
):
    """
    ✅ GET TODAY'S STATUS FOR ALL EMPLOYEES (HR only)
    Returns which employees have filled today's timesheet
    """
    today = date.today()
    yesterday = today - timedelta(days=1)
    
    # ✅ SKIP IF YESTERDAY WAS SUNDAY (weekend)
    if yesterday.weekday() == 6:  # Sunday
        yesterday = yesterday - timedelta(days=1)  # Go to Saturday
    
    # Get all employees
    all_employees = db.query(User).filter(User.role.in_(['Employee', 'Manager', 'Team Lead'])).all()
    
    result = []
    
    for employee in all_employees:
        # Check if entry exists for today
        today_entry = db.query(TimesheetEntry).filter(
            TimesheetEntry.user_id == employee.id,
            TimesheetEntry.date == today
        ).first()
        
        # Check yesterday
        yesterday_entry = db.query(TimesheetEntry).filter(
            TimesheetEntry.user_id == employee.id,
            TimesheetEntry.date == yesterday
        ).first()
        
        result.append({
            "user_id": employee.id,
            "name": employee.name,
            "email": employee.email,
            "designation": employee.designation,
            "today_status": today_entry.status if today_entry else 'pending',
            "yesterday_status": yesterday_entry.status if yesterday_entry else 'pending',
            "yesterday_date": str(yesterday),  # ✅ ADD THIS
            "today_hours": minutes_to_hours(today_entry.hours_logged) if today_entry and today_entry.hours_logged else 0,
            "is_locked_today": today_entry.is_locked if today_entry else False,
        })
    
    return result
