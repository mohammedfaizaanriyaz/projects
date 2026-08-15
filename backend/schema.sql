-- ============================================================
-- FULLSTACK DEMO DATABASE
-- Weight Tracker Module
-- ============================================================

CREATE DATABASE IF NOT EXISTS fullstack_demo
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE fullstack_demo;

-- ============================================================
-- 1. USERS TABLE
-- One main user can own multiple profiles.
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 2. PROFILES TABLE
-- Stores multiple people under one main user.
-- Example: Faizaan, Father, Mother.
-- ============================================================

CREATE TABLE IF NOT EXISTS profiles (
    profile_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    profile_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE
);

-- ============================================================
-- 3. BODY PROFILE TABLE
-- Stores body information for each profile.
-- One profile can have only one body_profile row.
-- ============================================================
CREATE TABLE IF NOT EXISTS body_profile (
    profile_id INT PRIMARY KEY,
    dob DATE NOT NULL,
    gender VARCHAR(20) NOT NULL,
    height_cm DECIMAL(5,2) NOT NULL,
    waist_cm DECIMAL(5,2),
    chest_cm DECIMAL(5,2),
    neck_cm DECIMAL(5,2),
    hip_cm DECIMAL(5,2),
    target_weight_kg DECIMAL(5,2),
    updated_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (profile_id)
        REFERENCES profiles(profile_id)
        ON DELETE CASCADE
);

-- ============================================================
-- 4. WEIGHT RECORDS TABLE
-- Stores weight history for each profile.
-- One profile can have multiple weight records.
-- ============================================================

CREATE TABLE IF NOT EXISTS weight_records (
    weight_id INT AUTO_INCREMENT PRIMARY KEY,
    profile_id INT NOT NULL,
    weight_kg DECIMAL(5,2) NOT NULL,
    bmi DECIMAL(5,2),
    body_fat_percentage DECIMAL(5,2),
    recorded_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (profile_id)
        REFERENCES profiles(profile_id)
        ON DELETE CASCADE
);

-- ============================================================
-- VERIFY
-- ============================================================

SHOW TABLES;
