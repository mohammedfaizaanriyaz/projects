-- ============================================================
-- FULLSTACK DEMO DATABASE
-- Weight + Body Measurement Tracker
-- ============================================================

CREATE DATABASE IF NOT EXISTS fullstack_demo
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE fullstack_demo;


-- ============================================================
-- DATABASE USER
-- ============================================================

CREATE OR REPLACE USER
    'fr-project-1'@'%'
    IDENTIFIED BY 'CHANGE_ME';

GRANT ALL PRIVILEGES
    ON fullstack_demo.*
    TO 'fr-project-1'@'%';

FLUSH PRIVILEGES;


-- ============================================================
-- 1. USERS
-- One main user can own multiple profiles.
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,

    name VARCHAR(100) NOT NULL,

    created_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- 2. PROFILES
-- One user can have multiple profiles.
-- ============================================================

CREATE TABLE IF NOT EXISTS profiles (
    profile_id INT AUTO_INCREMENT PRIMARY KEY,

    user_id INT NOT NULL,

    profile_name VARCHAR(100) NOT NULL,

    created_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE
);


-- ============================================================
-- 3. BODY PROFILE
-- Stores the CURRENT / LATEST body information.
-- One profile has one body_profile row.
-- ============================================================

CREATE TABLE IF NOT EXISTS body_profile (
    profile_id INT PRIMARY KEY,

    dob DATE NOT NULL,

    gender VARCHAR(20) NOT NULL,

    height_cm DECIMAL(5,2) NOT NULL,

    waist_cm DECIMAL(5,2),

    chest_cm DECIMAL(5,2),

    shoulder_cm DECIMAL(5,2),

    neck_cm DECIMAL(5,2),

    hip_cm DECIMAL(5,2),

    target_weight_kg DECIMAL(5,2),

    activity_level VARCHAR(30)
        NOT NULL
        DEFAULT 'not_specified',

    updated_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (profile_id)
        REFERENCES profiles(profile_id)
        ON DELETE CASCADE
);


-- ============================================================
-- 4. WEIGHT RECORDS
-- Stores WEIGHT HISTORY.
-- ============================================================

CREATE TABLE IF NOT EXISTS weight_records (
    weight_id INT AUTO_INCREMENT PRIMARY KEY,

    profile_id INT NOT NULL,

    weight_kg DECIMAL(5,2) NOT NULL,

    bmi DECIMAL(5,2),

    body_fat_percentage DECIMAL(5,2),

    recorded_date DATE NOT NULL,

    created_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (profile_id)
        REFERENCES profiles(profile_id)
        ON DELETE CASCADE
);


-- ============================================================
-- 5. MEASUREMENT RECORDS
-- Stores BODY MEASUREMENT HISTORY.
--
-- User can choose:
-- 1. Update current measurement only
-- 2. Save measurement as progress/history
-- ============================================================

CREATE TABLE IF NOT EXISTS measurement_records (
    measurement_id INT AUTO_INCREMENT PRIMARY KEY,

    profile_id INT NOT NULL,

    waist_cm DECIMAL(5,2),

    chest_cm DECIMAL(5,2),

    shoulder_cm DECIMAL(5,2),

    neck_cm DECIMAL(5,2),

    hip_cm DECIMAL(5,2),

    recorded_date DATE NOT NULL,

    created_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (profile_id)
        REFERENCES profiles(profile_id)
        ON DELETE CASCADE
);
-- ============================================================
-- 6. TASK LISTS
-- A user can create multiple custom lists.
-- Examples:
-- School, Programming, Morning Routine
-- ============================================================

CREATE TABLE IF NOT EXISTS task_lists (
    list_id INT AUTO_INCREMENT PRIMARY KEY,

    user_id INT NOT NULL,

    list_name VARCHAR(120) NOT NULL,

    list_type ENUM(
        'todo',
        'checklist'
    )
        NOT NULL
        DEFAULT 'todo',

    created_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE,

    INDEX idx_task_lists_user (
        user_id
    )
);


-- ============================================================
-- 7. TASKS
-- Tasks belonging to a task list.
-- ============================================================

CREATE TABLE IF NOT EXISTS tasks (
    task_id INT AUTO_INCREMENT PRIMARY KEY,

    list_id INT NOT NULL,

    title VARCHAR(200) NOT NULL,

    description TEXT,

    is_completed BOOLEAN
        NOT NULL
        DEFAULT FALSE,

    time_limit_minutes INT,

    due_at DATETIME,

    reminder_at DATETIME,

    completed_at DATETIME,

    created_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (list_id)
        REFERENCES task_lists(list_id)
        ON DELETE CASCADE,

    INDEX idx_tasks_list (
        list_id
    ),

    INDEX idx_tasks_due (
        due_at
    )
);

-- ============================================================
-- INDEXES
-- Helps history queries run faster.
-- ============================================================

CREATE INDEX idx_weight_profile_date
    ON weight_records(
        profile_id,
        recorded_date
    );

CREATE INDEX idx_measurement_profile_date
    ON measurement_records(
        profile_id,
        recorded_date
    );


-- ============================================================
-- VERIFY
-- ============================================================

SHOW TABLES;