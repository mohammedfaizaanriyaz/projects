-- ============================================================
-- WEIGHT TRACKER DATABASE SCHEMA
--download - create database weight tracker ;
-- ============================================================

-- PURPOSE
-- -------
-- This database stores users, their profiles, body measurements,
-- and weight history for the Weight Tracker application.
--
-- The application supports multiple profiles under one user.
--
-- Example:
--
-- User: Faizaan
--     |
--     +-- Profile 1: Faizaan
--     +-- Profile 2: Father
--     +-- Profile 3: Mother
--
-- Each profile can have:
--     1. One body profile
--     2. Multiple weight records
--
--
-- DATABASE RELATIONSHIP
-- ---------------------
--
-- users
--   |
--   | One user can have many profiles
--   v
-- profiles
--   |
--   +-----------------------+
--   |                       |
--   v                       v
-- body_profile        weight_records
--   1 : 1                 1 : many
--
--
-- HOW TO RUN THIS FILE
-- --------------------
--
-- 1. Open MariaDB:
--
--      sudo mariadb
--
-- 2. Create the database:
--
--      CREATE DATABASE weight_tracker;
--
-- 3. Exit MariaDB:
--
--      EXIT;
--
-- 4. Run this schema file:
--
--      sudo mariadb weight_tracker < schema.sql
--
-- 5. Open the database:
--
--      sudo mariadb weight_tracker
--
-- 6. Check that the tables were created:
--
--      SHOW TABLES;
--
-- Expected tables:
--
--      users
--      profiles
--      body_profile
--      weight_records
--
-- NOTE:
-- CREATE TABLE IF NOT EXISTS is used so running this file again
-- will not try to recreate tables that already exist.
--
-- ============================================================



-- ============================================================
-- 1. USERS TABLE
-- ============================================================
--
-- PURPOSE:
-- Stores the main application users/accounts.
--
-- Example:
--
-- user_id | name
-- --------+---------
-- 1       | Faizaan
--
-- One user can create multiple profiles.
--
-- COLUMNS:
--
-- user_id
--     Unique ID automatically generated for each user.
--
-- name
--     Name of the main user/account owner.
--
-- created_at
--     Date and time when the user was created.
--
-- ============================================================

CREATE TABLE IF NOT EXISTS users (

    user_id INT AUTO_INCREMENT PRIMARY KEY,

    name VARCHAR(100) NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);



-- ============================================================
-- 2. PROFILES TABLE
-- ============================================================
--
-- PURPOSE:
-- Allows one user to maintain weight information for multiple
-- people.
--
-- Example:
--
-- profile_id | user_id | profile_name
-- -----------+---------+-------------
-- 1          | 1       | Faizaan
-- 2          | 1       | Father
-- 3          | 1       | Mother
--
-- All three profiles belong to user_id = 1.
--
-- COLUMNS:
--
-- profile_id
--     Unique ID for every profile.
--
-- user_id
--     Identifies which main user owns this profile.
--
-- profile_name
--     Name of the person represented by the profile.
--
-- created_at
--     Date and time when the profile was created.
--
-- FOREIGN KEY:
--
-- user_id -> users.user_id
--
-- ON DELETE CASCADE means:
-- If a user is deleted, all profiles belonging to that user
-- are automatically deleted.
--
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
-- ============================================================
--
-- PURPOSE:
-- Stores body information used for BMI, body-fat calculations,
-- goals, and other health calculations.
--
-- Each profile can have ONLY ONE body_profile row.
--
-- Example:
--
-- profile_id = 1
-- height_cm = 182.88
-- waist_cm = 90
-- neck_cm = 40
--
-- profile_id is the PRIMARY KEY.
-- Therefore, the same profile_id cannot appear twice.
--
-- COLUMNS:
--
-- profile_id
--     Identifies which profile this body information belongs to.
--
-- dob
--     Date of birth.
--     Age should be calculated from DOB instead of permanently
--     storing age.
--
-- gender
--     Used when calculations require gender-specific formulas.
--
-- height_cm
--     Height stored internally in centimeters.
--
-- waist_cm
--     Waist circumference in centimeters.
--
-- neck_cm
--     Neck circumference in centimeters.
--
-- hip_cm
--     Hip circumference in centimeters.
--
-- target_weight_kg
--     Weight goal for this profile.
--
-- updated_at
--     Automatically changes whenever this row is updated.
--
-- FOREIGN KEY:
--
-- profile_id -> profiles.profile_id
--
-- ============================================================

CREATE TABLE IF NOT EXISTS body_profile (

    profile_id INT PRIMARY KEY,

    dob DATE NOT NULL,

    gender VARCHAR(20) NOT NULL,

    height_cm DECIMAL(5,2) NOT NULL,

    waist_cm DECIMAL(5,2),

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
-- ============================================================
--
-- PURPOSE:
-- Stores weight history for every profile.
--
-- Unlike body_profile, one profile can have MANY weight records.
--
-- Example:
--
-- Profile 1:
--
-- Date         Weight
-- ----------   ------
-- 2026-08-01   80.00 kg
-- 2026-08-08   79.20 kg
-- 2026-08-15   78.70 kg
--
-- These records can later be used by the frontend to create
-- weight-progress graphs.
--
-- COLUMNS:
--
-- weight_id
--     Unique ID automatically generated for every weight entry.
--
-- profile_id
--     Identifies which person's profile this weight belongs to.
--
-- weight_kg
--     Weight recorded in kilograms.
--
-- bmi
--     BMI calculated when the weight was recorded.
--
-- body_fat_percentage
--     Estimated body-fat percentage for this record.
--
-- recorded_date
--     Date when the measurement was actually taken.
--
-- created_at
--     Date and time when this database record was created.
--
-- FOREIGN KEY:
--
-- profile_id -> profiles.profile_id
--
-- ON DELETE CASCADE:
-- Deleting a profile automatically deletes all weight records
-- belonging to that profile.
--
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
-- END OF SCHEMA
-- ============================================================
--
-- To verify the database after running this file:
--
-- SHOW TABLES;
--
-- To inspect individual tables:
--
-- DESCRIBE users;
-- DESCRIBE profiles;
-- DESCRIBE body_profile;
-- DESCRIBE weight_records;
--
-- To see stored data:
--
-- SELECT * FROM users;
-- SELECT * FROM profiles;
-- SELECT * FROM body_profile;
-- SELECT * FROM weight_records;
--
-- ============================================================
