# tasks/scheduler.py
from apscheduler.schedulers.background import BackgroundScheduler
from sqlalchemy.orm import Session
from datetime import datetime, date, timedelta
from database import SessionLocal, TimesheetEntry, TimesheetUnlockRequest, User
from email_service import send_timesheet_lock_notification
import logging
import time


logger = logging.getLogger(__name__)


# Global scheduler instance
scheduler = BackgroundScheduler()


# ============= AUTO-LOCK PENDING ENTRIES =============

def auto_lock_pending_entries():
    """
    ✅ AUTO-LOCK UNFILLED TIMESHEETS + AUTO-EXPIRE UNUSED UNLOCKS
    
    STEP 1: Expire unused approved unlocks (if not filled within reasonable time)
    STEP 2: Lock entries older than 2 days that are still pending
    STEP 3: Send email notifications
    
    This ensures that approved unlocks that weren't used get expired before locking.
    """
    db = SessionLocal()
    
    try:
        today = date.today()
        cutoff_date = today - timedelta(days=2)
        
        logger.info(f"\n{'='*60}")
        logger.info(f"🔍 Starting auto-lock job at {datetime.now()}")
        logger.info(f"{'='*60}\n")
        
        # ============================================================
        # STEP 1: AUTO-EXPIRE UNUSED APPROVED UNLOCKS
        # ============================================================
        logger.info("⏰ STEP 1: Expiring unused approved unlocks...")
        
        expired_count = 0
        
        # Find approved unlocks where entry is still pending and not filled
        approved_unlocks = db.query(TimesheetUnlockRequest).filter(
            TimesheetUnlockRequest.status == "approved"
        ).all()
        
        for unlock_req in approved_unlocks:
            # Check the corresponding timesheet entry
            entry = db.query(TimesheetEntry).filter(
                TimesheetEntry.user_id == unlock_req.user_id,
                TimesheetEntry.date == unlock_req.date
            ).first()
            
            # If entry is still pending and not filled, expire the unlock
            if entry and entry.status == 'pending' and not entry.hours_logged:
                unlock_req.status = 'expired'
                expired_count += 1
                logger.info(f"   ⏰ Expired unlock: User {unlock_req.user_id} - Date {unlock_req.date}")
        
        if expired_count > 0:
            db.commit()
            logger.info(f"✅ Expired {expired_count} unused unlock requests\n")
        else:
            logger.info(f"ℹ️  No unlock requests to expire\n")
        
        # ============================================================
        # STEP 2: AUTO-LOCK PENDING ENTRIES
        # ============================================================
        logger.info(f"🔒 STEP 2: Locking pending entries older than {cutoff_date}...")
        
        # Find all unfilled entries older than 2 days
        unfilled_entries = db.query(TimesheetEntry).filter(
            TimesheetEntry.date < cutoff_date,
            TimesheetEntry.status == 'pending',
            TimesheetEntry.is_locked == False,
            TimesheetEntry.is_absent == False
        ).all()
        
        if not unfilled_entries:
            logger.info("ℹ️  No entries to auto-lock\n")
            return
        
        locked_count = 0
        email_sent_count = 0
        email_failed_count = 0
        
        logger.info(f"📋 Found {len(unfilled_entries)} entries to lock")
        
        for entry in unfilled_entries:
            try:
                # Lock the entry
                entry.is_locked = True
                entry.locked_at = datetime.utcnow()
                entry.locked_by = None  # System auto-lock
                
                # Get employee details
                employee = db.query(User).filter(User.id == entry.user_id).first()
                
                if not employee:
                    logger.warning(f"⚠️ Employee not found for entry {entry.id}")
                    continue
                
                # Get manager details (if exists)
                manager = None
                manager_email = None
                manager_name = None
                
                if employee.supervisor_id:
                    manager = db.query(User).filter(User.id == employee.supervisor_id).first()
                    if manager:
                        manager_email = manager.email
                        manager_name = manager.name
                
                # Send email notification
                try:
                    email_success = send_timesheet_lock_notification(
                        employee_email=employee.email,
                        employee_name=employee.name,
                        lock_date=entry.date,
                        manager_email=manager_email,
                        manager_name=manager_name
                    )
                    
                    if email_success:
                        email_sent_count += 1
                        logger.info(f"📧 Email sent: {employee.name} ({employee.email}) - {entry.date}")
                        if manager_email:
                            logger.info(f"   CC: {manager_name} ({manager_email})")
                    else:
                        email_failed_count += 1
                        logger.warning(f"⚠️ Email failed: {employee.email}")
                        
                except Exception as email_error:
                    email_failed_count += 1
                    logger.error(f"❌ Email error for {employee.email}: {email_error}")
                
                locked_count += 1
                logger.info(f"🔒 Locked: User {employee.name} - Entry {entry.date}")
                
            except Exception as entry_error:
                logger.error(f"❌ Error processing entry {entry.id}: {entry_error}")
                continue
        
        # Commit all locks
        db.commit()
        
        # Summary log
        logger.info(f"\n{'='*60}")
        logger.info(f"✅ AUTO-LOCK JOB COMPLETED")
        logger.info(f"{'='*60}")
        logger.info(f"📊 Summary:")
        logger.info(f"   - Unlock requests expired: {expired_count}")
        logger.info(f"   - Timesheet entries locked: {locked_count}")
        logger.info(f"   - Emails sent: {email_sent_count}")
        logger.info(f"   - Emails failed: {email_failed_count}")
        logger.info(f"   - Completed at: {datetime.now()}")
        logger.info(f"{'='*60}\n")
        
    except Exception as e:
        logger.error(f"❌ CRITICAL ERROR in auto_lock_pending_entries: {e}")
        db.rollback()
        
    finally:
        db.close()



# ============= AUTO-MARK ABSENT FOR 3 LOCKED ENTRIES =============

def auto_mark_absent_for_locked_entries():
    """
    ✅ AUTO-MARK ABSENT LOGIC (EXCLUDES SUNDAYS):
    - Runs daily after auto-lock job
    - For every 3 locked entries (without approved unlock), mark the oldest as absent
    - Already absent entries are NEVER re-evaluated
    - ✅ SKIPS SUNDAYS (weekends are not working days)
    - Logs all actions for audit trail
    """
    db = SessionLocal()
    
    try:
        logger.info(f"🔍 Starting auto-mark-absent job at {datetime.now()}")
        
        users = db.query(User).all()
        total_marked = 0
        results = []
        
        for user in users:
            try:
                # ✅ GET ONLY LOCKED ENTRIES THAT ARE NOT ALREADY ABSENT
                locked_entries = db.query(TimesheetEntry).filter(
                    TimesheetEntry.user_id == user.id,
                    TimesheetEntry.is_locked == True,
                    TimesheetEntry.is_absent == False
                ).order_by(TimesheetEntry.date).all()
                
                if not locked_entries:
                    continue
                
                # ✅ EXCLUDE APPROVED UNLOCK REQUESTS
                approved_unlock_dates = db.query(TimesheetUnlockRequest.date).filter(
                    TimesheetUnlockRequest.user_id == user.id,
                    TimesheetUnlockRequest.status == "approved"
                ).all()
                
                approved_dates_set = {req[0] for req in approved_unlock_dates}
                
                # ✅ FILTER: TRULY LOCKED (locked + not approved for unlock + not already absent)
                truly_locked = [e for e in locked_entries if e.date not in approved_dates_set]
                
                # ✅ EXCLUDE SUNDAYS (weekday: 0=Mon, 6=Sun)
                truly_locked_no_sundays = [
                    e for e in truly_locked 
                    if e.date.weekday() != 6  # ✅ EXCLUDE SUNDAY
                ]
                
                if len(truly_locked_no_sundays) < 3:
                    continue
                
                # ✅ FOR EVERY 3 LOCKED ENTRIES, MARK THE OLDEST AS ABSENT
                marked_count = 0
                index = 0
                
                while index + 2 < len(truly_locked_no_sundays):
                    oldest_entry = truly_locked_no_sundays[index]
                    
                    # Double-check it's not Sunday (safety check)
                    if oldest_entry.date.weekday() == 6:
                        logger.warning(f"⚠️ Skipping Sunday: {oldest_entry.date}")
                        index += 1
                        continue
                    
                    # Mark as absent
                    oldest_entry.is_absent = True
                    oldest_entry.status = "absent"
                    
                    result = {
                        "user_id": user.id,
                        "user_name": user.name,
                        "user_email": user.email,
                        "date": str(oldest_entry.date),
                        "day_of_week": oldest_entry.date.strftime('%A'),
                        "action": "marked_absent"
                    }
                    results.append(result)
                    
                    logger.info(f"❌ Marked ABSENT: {user.name} - {oldest_entry.date} ({oldest_entry.date.strftime('%A')})")
                    
                    marked_count += 1
                    total_marked += 1
                    
                    # Move to next group of 3
                    index += 3
                
                if marked_count > 0:
                    logger.info(f"   User {user.name}: Marked {marked_count} entries as absent")
                    
            except Exception as user_error:
                logger.error(f"❌ Error processing user {user.id}: {user_error}")
                continue
        
        # Commit all changes
        db.commit()
        
        # Summary log
        logger.info(f"\n{'='*60}")
        logger.info(f"✅ AUTO-MARK-ABSENT JOB COMPLETED")
        logger.info(f"{'='*60}")
        logger.info(f"📊 Summary:")
        logger.info(f"   - Total users processed: {len(users)}")
        logger.info(f"   - Total entries marked absent: {total_marked}")
        logger.info(f"   - Sundays excluded: Yes")
        logger.info(f"   - Completed at: {datetime.now()}")
        logger.info(f"{'='*60}\n")
        
        return results
        
    except Exception as e:
        logger.error(f"❌ CRITICAL ERROR in auto_mark_absent_for_locked_entries: {e}")
        db.rollback()
        return []
        
    finally:
        db.close()


# ============= SCHEDULER MANAGEMENT =============

def start_scheduler():
    """
    Start the background scheduler with both jobs:
    1. Auto-lock pending entries (11:38 PM for testing)
    2. Auto-mark absent for 3 locked entries (11:39 PM - 1 min after lock)
    
    ✅ Auto-mark-absent runs 1 minute AFTER auto-lock to ensure entries are locked first
    """
    global scheduler
    
    try:
        # ✅ JOB 1: AUTO-LOCK at 11:38 PM
        scheduler.add_job(
            func=auto_lock_pending_entries,
            trigger='cron',
            hour=0,        # 11:38 PM
            minute=1,
            id='auto_lock_pending_entries',
            replace_existing=True,
            max_instances=1,
            coalesce=True
        )
        
        # ✅ JOB 2: AUTO-MARK-ABSENT at 11:39 PM (1 minute after auto-lock)
        scheduler.add_job(
            func=auto_mark_absent_for_locked_entries,
            trigger='cron',
            hour=0,        # 11:39 PM
            minute=2,      # 1 minute after auto-lock
            id='auto_mark_absent',
            replace_existing=True,
            max_instances=1,
            coalesce=True
        )
        
        scheduler.start()
        
        logger.info("="*60)
        logger.info("🚀 SCHEDULER STARTED SUCCESSFULLY")
        logger.info("="*60)
        logger.info("📅 Scheduled Jobs:")
        logger.info("   1. Auto-lock job:")
        logger.info("      - Time: Daily at 23:38 (11:38 PM)")
        logger.info("      - Action: Lock entries older than 2 days")
        logger.info("      - Notifications: Email to employee + CC manager")
        logger.info("")
        logger.info("   2. Auto-mark-absent job:")
        logger.info("      - Time: Daily at 23:39 (11:39 PM)")
        logger.info("      - Action: For every 3 locked, mark oldest as absent")
        logger.info("      - Runs 1 minute after auto-lock")
        logger.info("      - Excludes Sundays")
        logger.info("="*60)
        
    except Exception as e:
        logger.error(f"❌ Failed to start scheduler: {e}")
        raise


def stop_scheduler():
    """
    Stop the scheduler gracefully
    """
    global scheduler
    try:
        if scheduler.running:
            scheduler.shutdown()
            logger.info("🛑 Scheduler stopped")
    except Exception as e:
        logger.error(f"❌ Error stopping scheduler: {e}")


def get_scheduler_status():
    """
    Get current scheduler status and next run time
    """
    global scheduler
    try:
        if not scheduler.running:
            return {"status": "stopped", "jobs": []}
        
        jobs = []
        for job in scheduler.get_jobs():
            jobs.append({
                "id": job.id,
                "name": job.name,
                "next_run": str(job.next_run_time),
                "trigger": str(job.trigger)
            })
        
        return {
            "status": "running",
            "jobs": jobs
        }
    except Exception as e:
        logger.error(f"❌ Error getting scheduler status: {e}")
        return {"status": "error", "message": str(e)}
