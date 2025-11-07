-- Create Timesheet Tables
-- Run this in your PostgreSQL database

-- =====================================================
-- 1. TIMESHEET ENTRIES TABLE (Main)
-- =====================================================
CREATE TABLE IF NOT EXISTS timesheet_entries (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    start_time VARCHAR(5) NOT NULL,
    end_time VARCHAR(5) NOT NULL,
    hours_logged INTEGER,
    description TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    is_absent BOOLEAN DEFAULT false,
    is_locked BOOLEAN DEFAULT false,
    locked_at TIMESTAMP,
    locked_by VARCHAR(36) REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, date)
);

CREATE INDEX idx_timesheet_user_date ON timesheet_entries(user_id, date);
CREATE INDEX idx_timesheet_status ON timesheet_entries(status);
CREATE INDEX idx_timesheet_date ON timesheet_entries(date);

-- =====================================================
-- 2. TIMESHEET ACTIVITIES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS timesheet_activities (
    id VARCHAR(36) PRIMARY KEY,
    timesheet_id VARCHAR(36) NOT NULL REFERENCES timesheet_entries(id) ON DELETE CASCADE,
    slot VARCHAR(20) NOT NULL,
    description VARCHAR(255) NOT NULL,
    output TEXT,
    start_time VARCHAR(5),
    end_time VARCHAR(5),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_activity_timesheet ON timesheet_activities(timesheet_id);

-- =====================================================
-- 3. TIMESHEET LOCK POLICIES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS timesheet_lock_policies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    lock_after_days INTEGER DEFAULT 2,
    lock_time VARCHAR(5) DEFAULT '23:59',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default policy
INSERT INTO timesheet_lock_policies (name, lock_after_days, lock_time, is_active)
VALUES ('Default Lock Policy', 2, '23:59', true)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 4. TIMESHEET UNLOCK REQUESTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS timesheet_unlock_requests (
    id VARCHAR(36) PRIMARY KEY,
    timesheet_id VARCHAR(36) NOT NULL REFERENCES timesheet_entries(id) ON DELETE CASCADE,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    approved_by VARCHAR(36) REFERENCES users(id),
    approved_on TIMESTAMP,
    remarks TEXT,
    requested_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_unlock_status ON timesheet_unlock_requests(status);
CREATE INDEX idx_unlock_user ON timesheet_unlock_requests(user_id);
CREATE INDEX idx_unlock_timesheet ON timesheet_unlock_requests(timesheet_id);
