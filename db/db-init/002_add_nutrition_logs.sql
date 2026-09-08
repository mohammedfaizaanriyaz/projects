USE fullstack_demo;

-- ============================================================
-- DAILY NUTRITION LOGS
-- Stores a snapshot of a USDA calculation when the user
-- chooses "Add to Today".
-- ============================================================

CREATE TABLE IF NOT EXISTS nutrition_logs (
    log_id INT AUTO_INCREMENT PRIMARY KEY,

    profile_id INT NOT NULL,

    fdc_id BIGINT,

    food_name VARCHAR(255) NOT NULL,

    quantity DECIMAL(12,3) NOT NULL,

    unit VARCHAR(100) NOT NULL,

    weight_grams DECIMAL(12,3) NOT NULL,

    meal_type ENUM(
        'breakfast',
        'lunch',
        'dinner',
        'snack',
        'other'
    )
        NOT NULL
        DEFAULT 'other',

    logged_date DATE NOT NULL,

    calories DECIMAL(14,2),

    protein_g DECIMAL(14,2),

    carbs_g DECIMAL(14,2),

    fat_g DECIMAL(14,2),

    saturated_fat_g DECIMAL(14,2),

    fiber_g DECIMAL(14,2),

    sugar_g DECIMAL(14,2),

    potassium_mg DECIMAL(14,2),

    sodium_mg DECIMAL(14,2),

    calcium_mg DECIMAL(14,2),

    iron_mg DECIMAL(14,2),

    magnesium_mg DECIMAL(14,2),

    phosphorus_mg DECIMAL(14,2),

    zinc_mg DECIMAL(14,2),

    vitamin_c_mg DECIMAL(14,2),

    created_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (profile_id)
        REFERENCES profiles(profile_id)
        ON DELETE CASCADE,

    INDEX idx_nutrition_profile_date (
        profile_id,
        logged_date
    ),

    INDEX idx_nutrition_profile_meal (
        profile_id,
        logged_date,
        meal_type
    )
);
