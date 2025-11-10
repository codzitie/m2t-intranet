# test_scheduler.py
import sys
import logging
from pathlib import Path

# Add current directory to path
sys.path.insert(0, str(Path(__file__).parent))

from tasks.scheduler import auto_lock_pending_entries

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

if __name__ == "__main__":
    print("🔄 Manually triggering auto-lock job...\n")
    auto_lock_pending_entries()
    print("\n✅ Test completed!")
