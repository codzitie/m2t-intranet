from database import SessionLocal, User, TimesheetEntry, TimesheetActivity
from datetime import date, datetime, timedelta
from sqlalchemy import func
import uuid


def seed_timesheet_data():
    """Populate database with test timesheet data"""
    
    print("🔧 Seeding timesheet data...\n")
    
    db = SessionLocal()
    
    try:
        # Check if timesheet data already exists
        existing_entries = db.query(TimesheetEntry).count()
        if existing_entries > 0:
            print("⚠️  Timesheet data already exists. Skipping seed.")
            print(f"   Found {existing_entries} existing timesheet entries.")
            return
        
        # Get all employees
        employees = db.query(User).filter(User.role == "Employee").all()
        
        if not employees:
            print("❌ No employees found. Please run seed_data.py first!")
            return
        
        print(f"📊 Creating timesheet entries for {len(employees)} employees...\n")
        
        # ============= CREATE TIMESHEET ENTRIES =============
        # Create entries for the current month (November 2025)
        
        today = date.today()
        month_start = date(today.year, today.month, 1)
        
        # Calculate last day of month
        if today.month == 12:
            month_end = date(today.year + 1, 1, 1) - timedelta(days=1)
        else:
            month_end = date(today.year, today.month + 1, 1) - timedelta(days=1)
        
        total_entries = 0
        
        # Sample activity descriptions
        morning_activities = [
            "Sprint planning meeting",
            "Team standup & discussion",
            "Architecture review session",
            "Code review with peers",
            "Project kickoff meeting",
        ]
        
        afternoon_activities = [
            "Backend API development",
            "Frontend component development",
            "Database optimization",
            "Bug fixes and debugging",
            "Testing and QA",
            "Documentation update",
        ]
        
        morning_outputs = [
            "Defined user stories for Q4",
            "Resolved blockers for team",
            "Reviewed design specifications",
            "Approved 5 pull requests",
            "Planned sprint deliverables",
        ]
        
        afternoon_outputs = [
            "Created 3 REST endpoints",
            "Implemented 2 UI components",
            "Optimized database queries",
            "Fixed 4 critical bugs",
            "Completed 80% of assigned tasks",
            "Updated API documentation",
        ]
        
        # Create timesheet for each employee
        for emp_idx, employee in enumerate(employees):
            current_date = month_start
            emp_entries = 0
            
            while current_date <= month_end and current_date <= today:
                # Skip Sundays (non-working day)
                if current_date.weekday() == 6:
                    current_date += timedelta(days=1)
                    continue
                
                # Vary the data for different employees
                if emp_idx % 2 == 0:
                    # Even employees: consistent entries
                    start_time = "09:00"
                    end_time = "17:30"
                    hours_minutes = 510  # 8.5 hours
                    status = "filled"
                    is_absent = False
                else:
                    # Odd employees: some pending/absent
                    if current_date.day % 5 == 0:
                        # Every 5th day - pending entry
                        start_time = "09:00"
                        end_time = "16:00"
                        hours_minutes = 420  # 7 hours
                        status = "pending"
                        is_absent = False
                    elif current_date.day % 7 == 0:
                        # Every 7th day - absent
                        start_time = "00:00"
                        end_time = "00:00"
                        hours_minutes = 0
                        status = "absent"
                        is_absent = True
                    else:
                        # Regular filled entry
                        start_time = "09:30"
                        end_time = "18:00"
                        hours_minutes = 510  # 8.5 hours
                        status = "filled"
                        is_absent = False
                
                # Create timesheet entry
                entry = TimesheetEntry(
                    id=str(uuid.uuid4()),
                    user_id=employee.id,
                    date=current_date,
                    start_time=start_time,
                    end_time=end_time,
                    hours_logged=hours_minutes if not is_absent else None,
                    description=f"Daily work summary for {current_date.strftime('%B %d, %Y')}",
                    status=status,
                    is_absent=is_absent,
                    is_locked=False,
                    created_at=datetime.now(),  # ✅ FIXED: Changed from utcnow()
                    updated_at=datetime.now()   # ✅ FIXED: Changed from utcnow()
                )
                
                db.add(entry)
                db.flush()  # Flush to get the entry ID
                
                # Create activities for non-absent entries
                if not is_absent:
                    morning_activity = TimesheetActivity(
                        id=str(uuid.uuid4()),
                        timesheet_id=entry.id,
                        slot="morning",
                        description=morning_activities[emp_idx % len(morning_activities)],
                        output=morning_outputs[emp_idx % len(morning_outputs)],
                        start_time=start_time,
                        end_time="12:30"
                    )
                    
                    afternoon_activity = TimesheetActivity(
                        id=str(uuid.uuid4()),
                        timesheet_id=entry.id,
                        slot="afternoon",
                        description=afternoon_activities[emp_idx % len(afternoon_activities)],
                        output=afternoon_outputs[emp_idx % len(afternoon_outputs)],
                        start_time="13:30",
                        end_time=end_time
                    )
                    
                    db.add(morning_activity)
                    db.add(afternoon_activity)
                
                emp_entries += 1
                total_entries += 1
                current_date += timedelta(days=1)
            
            print(f"   ✅ Created {emp_entries} entries for {employee.name}")
        
        db.commit()
        
        # ============= SUMMARY ✅ FIXED =============
        print("\n" + "="*70)
        print("✅ TIMESHEET DATA SEEDED SUCCESSFULLY!")
        print("="*70)
        print(f"\n📊 Summary:")
        print(f"   Total timesheet entries created: {total_entries}")
        print(f"   Employees with data: {len(employees)}")
        print(f"   Month: {month_start.strftime('%B %Y')}")
        print(f"   Date range: {month_start.strftime('%d-%b-%Y')} to {min(month_end, today).strftime('%d-%b-%Y')}")
        
        print(f"\n📋 Entry Status Breakdown:")
        filled = db.query(TimesheetEntry).filter(TimesheetEntry.status == "filled").count()
        pending = db.query(TimesheetEntry).filter(TimesheetEntry.status == "pending").count()
        absent = db.query(TimesheetEntry).filter(TimesheetEntry.is_absent == True).count()
        
        print(f"   ✅ Filled: {filled}")
        print(f"   ⏳ Pending: {pending}")
        print(f"   ❌ Absent: {absent}")
        
        print(f"\n👥 Employee Timesheet Breakdown:")
        for emp in employees:
            emp_filled = db.query(TimesheetEntry).filter(
                TimesheetEntry.user_id == emp.id,
                TimesheetEntry.status == "filled"
            ).count()
            
            # ✅ FIXED: Use func from sqlalchemy
            emp_total_hours_result = db.query(
                func.sum(TimesheetEntry.hours_logged)
            ).filter(
                TimesheetEntry.user_id == emp.id
            ).first()
            
            total_hours = (emp_total_hours_result[0] or 0) / 60  # Convert minutes to hours
            
            print(f"   {emp.name}:")
            print(f"      Entries: {emp_filled}, Total Hours: {total_hours:.1f}h")
        
        print("\n" + "="*70)
        print("🎯 Next Steps:")
        print("   1. Start your backend server:")
        print("      uvicorn main:app --reload")
        print("   2. Visit API Docs:")
        print("      http://localhost:8000/docs")
        print("   3. Login with any employee account")
        print("   4. Test timesheet endpoints!")
        print("="*70 + "\n")
        
    except Exception as e:
        print(f"\n❌ Error seeding timesheet data: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_timesheet_data()
