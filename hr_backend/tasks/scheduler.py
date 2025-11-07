from apscheduler.schedulers.background import BackgroundScheduler
from sqlalchemy.orm import Session
from datetime import date, timedelta
from database import SessionLocal, TimesheetEntry
import logging

logger = logging.getLogger(__name__)

def auto_lock_pending_entries():
    """
    ✅ RUNS DAILY AT 4:15 PM (16:15)
    - Locks any unfilled entries from yesterday and older
    """
    db = SessionLocal()
    try:
        today = date.today()
        yesterday = today - timedelta(days=1)
        
        # ✅ FIND ALL UNFILLED ENTRIES OLDER THAN YESTERDAY
        unfilled_entries = db.query(TimesheetEntry).filter(
            TimesheetEntry.date < yesterday,
            TimesheetEntry.status == 'pending',
            TimesheetEntry.is_locked == False,
            TimesheetEntry.is_absent == False
        ).all()
        
        if unfilled_entries:
            for entry in unfilled_entries:
                entry.is_locked = True
                entry.locked_at = date.today()
                logger.info(f"🔒 AUTO-LOCKED: User {entry.user_id} entry for {entry.date}")
            
            db.commit()
            logger.info(f"✅ Auto-locked {len(unfilled_entries)} entries")
        else:
            logger.info("ℹ️ No entries to auto-lock")
    
    except Exception as e:
        logger.error(f"❌ Auto-lock error: {e}")
        db.rollback()
    finally:
        db.close()

def start_scheduler():
    """Start the background scheduler"""
    scheduler = BackgroundScheduler()
    
    # ✅ RUN EVERY DAY AT 4:15 PM (16:15)
    scheduler.add_job(
        auto_lock_pending_entries,
        'cron',
        hour=16,
        minute=25,    # ✅ CHANGED TO 15
        id='auto_lock_job'
    )
    
    scheduler.start()
    logger.info("✅ Scheduler started - Auto-lock job scheduled daily at 16:25")  # ✅ UPDATED LOG
    
    return scheduler
