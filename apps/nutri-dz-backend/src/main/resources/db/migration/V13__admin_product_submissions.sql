-- Admin data-collection workflow.
-- Products scanned by admins land in product_submissions (PENDING) and only
-- reach the `foods` table the mobile app reads once an admin approves them.

ALTER TABLE foods ADD COLUMN brand VARCHAR(120) NULL;

CREATE TABLE product_submissions (
    id                  BIGINT          AUTO_INCREMENT PRIMARY KEY,
    barcode             VARCHAR(50),
    code_format         VARCHAR(20),
    name                VARCHAR(200)    NOT NULL,
    name_ar             VARCHAR(200),
    brand               VARCHAR(120),
    category            VARCHAR(30)     NOT NULL,
    calories_per_100g   FLOAT           NOT NULL DEFAULT 0,
    protein_per_100g    FLOAT,
    carbs_per_100g      FLOAT,
    fat_per_100g        FLOAT,
    fiber_per_100g      FLOAT,
    sugar_per_100g      FLOAT,
    salt_per_100g       FLOAT,
    nutritional_score   VARCHAR(1),
    serving_sizes_json  TEXT,
    product_image       MEDIUMTEXT,
    label_image         MEDIUMTEXT,
    ocr_text            TEXT,
    status              VARCHAR(20)     NOT NULL DEFAULT 'PENDING',
    reject_reason       VARCHAR(500),
    target_food_id      BIGINT,
    food_id             BIGINT,
    submitted_by        BIGINT          NOT NULL,
    reviewed_by         BIGINT,
    created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    reviewed_at         DATETIME,
    CONSTRAINT fk_sub_submitter FOREIGN KEY (submitted_by) REFERENCES users(id),
    CONSTRAINT fk_sub_reviewer  FOREIGN KEY (reviewed_by)  REFERENCES users(id),
    CONSTRAINT fk_sub_food      FOREIGN KEY (food_id)      REFERENCES foods(id) ON DELETE SET NULL,
    CONSTRAINT fk_sub_target    FOREIGN KEY (target_food_id) REFERENCES foods(id) ON DELETE SET NULL,
    INDEX idx_sub_status (status, created_at),
    INDEX idx_sub_barcode (barcode)
);

-- Product photos for approved foods, served publicly at
-- /api/public/food-images/{foodId} so foods.image_url stays a short URL.
CREATE TABLE food_images (
    food_id     BIGINT          PRIMARY KEY,
    mime_type   VARCHAR(40)     NOT NULL,
    data        MEDIUMBLOB      NOT NULL,
    updated_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_food_image FOREIGN KEY (food_id) REFERENCES foods(id) ON DELETE CASCADE
);
