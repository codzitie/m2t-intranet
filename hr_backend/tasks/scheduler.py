# tasks/scheduler.py
from apscheduler.schedulers.background import BackgroundScheduler
from sqlalchemy.orm import Session
from datetime import datetime, date, timedelta
from database import SessionLocal, TimesheetEntry, User
from email_service import send_timesheet_lock_notification
import logging

logger = logging.getLogger(__name__)

# Global scheduler instance
scheduler = BackgroundScheduler()


def auto_lock_pending_entries():
    """
    ✅ AUTO-LOCK UNFILLED TIMESHEETS + SEND EMAIL NOTIFICATIONS
    
    - Runs daily at configured time (default: 11:59 PM)
    - Locks entries older than 2 days that are still pending
    - Sends email to employee with CC to their manager
    - Logs all actions for audit trail
    """
    db = SessionLocal()
    
    try:
        # Calculate cutoff date (2 days ago)
        today = date.today()
        cutoff_date = today - timedelta(days=2)
        
        logger.info(f"🔍 Starting auto-lock job at {datetime.now()}")
        logger.info(f"📅 Checking for entries before: {cutoff_date}")
        
        # Find all unfilled entries older than 2 days
        unfilled_entries = db.query(TimesheetEntry).filter(
            TimesheetEntry.date < cutoff_date,
            TimesheetEntry.status == 'pending',
            TimesheetEntry.is_locked == False,
            TimesheetEntry.is_absent == False
        ).all()
        
        if not unfilled_entries:
            logger.info("ℹ️ No entries to auto-lock")
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
                entry.locked_by = None  # System auto-lock (no specific user)
                
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
        logger.info(f"   - Total entries locked: {locked_count}")
        logger.info(f"   - Emails sent: {email_sent_count}")
        logger.info(f"   - Emails failed: {email_failed_count}")
        logger.info(f"   - Completed at: {datetime.now()}")
        logger.info(f"{'='*60}\n")
        
    except Exception as e:
        logger.error(f"❌ CRITICAL ERROR in auto_lock_pending_entries: {e}")
        db.rollback()
        
    finally:
        db.close()


def start_scheduler():
    """
    Start the background scheduler with auto-lock job
    
    Scheduling Options:
    - Default: Daily at 11:59 PM (23:59)
    - Can be configured to any time
    """
    global scheduler
    
    try:
        # Schedule auto-lock job
        # ✅ RUNS DAILY AT 11:59 PM (23:59)
        # Change hour/minute values to customize timing
        scheduler.add_job(
            func=auto_lock_pending_entries,
            trigger='cron',
            hour=22,        # ✅ CHANGE THIS: 0-23 (24-hour format)
            minute=39,      # ✅ CHANGE THIS: 0-59
            id='auto_lock_pending_entries',
            replace_existing=True,
            max_instances=1,
            coalesce=True
        )
        
        scheduler.start()
        
        logger.info("="*60)
        logger.info("🚀 SCHEDULER STARTED SUCCESSFULLY")
        logger.info("="*60)
        logger.info("📅 Auto-lock job scheduled:")
        logger.info("   - Time: Daily at 23:59 (11:59 PM)")
        logger.info("   - Action: Lock entries older than 2 days")
        logger.info("   - Notifications: Email to employee + CC manager")
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
