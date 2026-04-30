-- Reports table for community moderation
-- Existing is_public flag controls visibility (user-created recipes default to public)
-- When report count >= 3, auto-hide via app logic

ALTER TABLE recipes ADD COLUMN reported_count INT NOT NULL DEFAULT 0;

CREATE TABLE recipe_reports (
    id          BIGINT          AUTO_INCREMENT PRIMARY KEY,
    recipe_id   BIGINT          NOT NULL,
    user_id     BIGINT          NOT NULL,
    reason      VARCHAR(500),
    reported_at DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_report_recipe FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
    CONSTRAINT fk_report_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uq_report (recipe_id, user_id)
);
