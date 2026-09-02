-- ============================================================
-- MIGRATION 001
-- Sync existing database with current schema
-- ============================================================

USE fullstack_demo;


-- ============================================================
-- USERS
-- ============================================================

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS email
        VARCHAR(255)
        NULL
        AFTER name,

    ADD COLUMN IF NOT EXISTS password_hash
        VARCHAR(255)
        NULL
        AFTER email;


-- ============================================================
-- BODY PROFILE
-- ============================================================

ALTER TABLE body_profile
    ADD COLUMN IF NOT EXISTS activity_level
        VARCHAR(30)
        NOT NULL
        DEFAULT 'not_specified'
        AFTER target_weight_kg;


-- ============================================================
-- TASKS
-- ============================================================

ALTER TABLE tasks
    ADD COLUMN IF NOT EXISTS reminder_at
        DATETIME
        NULL
        AFTER due_at,

    ADD COLUMN IF NOT EXISTS reminder_sent_at
        DATETIME
        NULL
        AFTER reminder_at,

    ADD COLUMN IF NOT EXISTS completed_at
        DATETIME
        NULL
        AFTER reminder_sent_at;


-- ============================================================
-- UNIQUE EMAIL INDEX
-- ============================================================

CREATE UNIQUE INDEX IF NOT EXISTS
    uq_users_email
ON users (
    email
);


-- ============================================================
-- WEIGHT HISTORY INDEX
-- ============================================================

CREATE INDEX IF NOT EXISTS
    idx_weight_profile_date
ON weight_records (
    profile_id,
    recorded_date
);


-- ============================================================
-- MEASUREMENT HISTORY INDEX
-- ============================================================

CREATE INDEX IF NOT EXISTS
    idx_measurement_profile_date
ON measurement_records (
    profile_id,
    recorded_date
);


-- ============================================================
-- VERIFY
-- ============================================================

-- ============================================================
-- COMPLETE
-- ============================================================
SELECT
    'Added email, password_hash, activity_level, reminder fields and indexes successfully'
    AS status;