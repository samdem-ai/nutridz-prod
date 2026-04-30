

CREATE TABLE users (
                       id                      BIGINT          AUTO_INCREMENT PRIMARY KEY,
                       username                VARCHAR(50)     NOT NULL UNIQUE,
                       email                   VARCHAR(100)    NOT NULL UNIQUE,
                       password_hash           TEXT            NOT NULL,
                       role                    VARCHAR(20)     NOT NULL DEFAULT 'USER',
                       gender                  VARCHAR(10),
                       birth_date              DATE,
                       height_cm               FLOAT,
                       weight_kg               FLOAT,
                       activity_level          VARCHAR(20),
                       work_type               VARCHAR(20),
                       workout_type            VARCHAR(20),
                       diabetes_type           VARCHAR(10)     NOT NULL DEFAULT 'NONE',
                       allergies               VARCHAR(500),
                       nutrition_goal          VARCHAR(20),
                       daily_calorie_target    FLOAT,
                       daily_protein_target    FLOAT,
                       daily_carb_target       FLOAT,
                       daily_fat_target        FLOAT,
                       daily_water_target_ml   FLOAT,
                       created_at              DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE user_profiles (
                               id              BIGINT          AUTO_INCREMENT PRIMARY KEY,
                               user_id         BIGINT          NOT NULL UNIQUE,
                               bio             VARCHAR(500),
                               avatar_url      TEXT,
                               total_likes     INT             NOT NULL DEFAULT 0,
                               total_recipes   INT             NOT NULL DEFAULT 0,
                               is_public       TINYINT(1)      NOT NULL DEFAULT 1,
                               CONSTRAINT fk_profile_user FOREIGN KEY (user_id)
                                   REFERENCES users(id) ON DELETE CASCADE
);


CREATE TABLE foods (
                       id                  BIGINT          AUTO_INCREMENT PRIMARY KEY,
                       name                VARCHAR(200)    NOT NULL,
                       name_ar             VARCHAR(200),
                       category            VARCHAR(30)     NOT NULL,
                       source              VARCHAR(30)     NOT NULL,
                       calories_per_100g   FLOAT           NOT NULL DEFAULT 0,
                       protein_per_100g    FLOAT,
                       carbs_per_100g      FLOAT,
                       fat_per_100g        FLOAT,
                       fiber_per_100g      FLOAT,
                       sugar_per_100g      FLOAT,
                       salt_per_100g       FLOAT,
                       nutritional_score   VARCHAR(1),
                       barcode             VARCHAR(50)     UNIQUE,
                       image_url           TEXT,
                       verified            TINYINT(1)      NOT NULL DEFAULT 0
);


CREATE TABLE food_serving_sizes (
                                    id          BIGINT          AUTO_INCREMENT PRIMARY KEY,
                                    food_id     BIGINT          NOT NULL,
                                    label       VARCHAR(100)    NOT NULL,
                                    grams       FLOAT           NOT NULL,
                                    CONSTRAINT fk_serving_food FOREIGN KEY (food_id)
                                        REFERENCES foods(id) ON DELETE CASCADE
);


CREATE TABLE recipes (
                         id                      BIGINT          AUTO_INCREMENT PRIMARY KEY,
                         author_id               BIGINT          NOT NULL,
                         title                   VARCHAR(200)    NOT NULL,
                         title_ar                VARCHAR(200),
                         description             VARCHAR(1000),
                         image_url               TEXT,
                         prep_time_minutes       INT,
                         servings                INT             NOT NULL DEFAULT 1,
                         calories_per_serving    FLOAT,
                         protein_per_serving     FLOAT,
                         carbs_per_serving       FLOAT,
                         fat_per_serving         FLOAT,
                         category                VARCHAR(20)     NOT NULL,
                         is_algerian             TINYINT(1)      NOT NULL DEFAULT 0,
                         is_public               TINYINT(1)      NOT NULL DEFAULT 0,
                         likes_count             INT             NOT NULL DEFAULT 0,
                         created_at              DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
                         CONSTRAINT fk_recipe_author FOREIGN KEY (author_id)
                             REFERENCES users(id) ON DELETE CASCADE
);


CREATE TABLE recipe_ingredients (
                                    id              BIGINT          AUTO_INCREMENT PRIMARY KEY,
                                    recipe_id       BIGINT          NOT NULL,
                                    food_id         BIGINT          NOT NULL,
                                    quantity_grams  FLOAT           NOT NULL,
                                    label           VARCHAR(200),
                                    CONSTRAINT fk_ing_recipe FOREIGN KEY (recipe_id)
                                        REFERENCES recipes(id) ON DELETE CASCADE,
                                    CONSTRAINT fk_ing_food FOREIGN KEY (food_id)
                                        REFERENCES foods(id)
);


CREATE TABLE recipe_steps (
                              id              BIGINT          AUTO_INCREMENT PRIMARY KEY,
                              recipe_id       BIGINT          NOT NULL,
                              step_number     INT             NOT NULL,
                              description     VARCHAR(1000)   NOT NULL,
                              CONSTRAINT fk_step_recipe FOREIGN KEY (recipe_id)
                                  REFERENCES recipes(id) ON DELETE CASCADE
);


CREATE TABLE recipe_likes (
                              id          BIGINT      AUTO_INCREMENT PRIMARY KEY,
                              user_id     BIGINT      NOT NULL,
                              recipe_id   BIGINT      NOT NULL,
                              liked_at    DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
                              UNIQUE KEY uq_like (user_id, recipe_id),
                              CONSTRAINT fk_like_user FOREIGN KEY (user_id)
                                  REFERENCES users(id) ON DELETE CASCADE,
                              CONSTRAINT fk_like_recipe FOREIGN KEY (recipe_id)
                                  REFERENCES recipes(id) ON DELETE CASCADE
);


CREATE TABLE recipe_comments (
                                 id          BIGINT          AUTO_INCREMENT PRIMARY KEY,
                                 user_id     BIGINT          NOT NULL,
                                 recipe_id   BIGINT          NOT NULL,
                                 content     VARCHAR(1000)   NOT NULL,
                                 created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
                                 CONSTRAINT fk_comment_user FOREIGN KEY (user_id)
                                     REFERENCES users(id) ON DELETE CASCADE,
                                 CONSTRAINT fk_comment_recipe FOREIGN KEY (recipe_id)
                                     REFERENCES recipes(id) ON DELETE CASCADE
);


CREATE TABLE saved_recipes (
                               id          BIGINT      AUTO_INCREMENT PRIMARY KEY,
                               user_id     BIGINT      NOT NULL,
                               recipe_id   BIGINT      NOT NULL,
                               saved_at    DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
                               UNIQUE KEY uq_saved (user_id, recipe_id),
                               CONSTRAINT fk_saved_user FOREIGN KEY (user_id)
                                   REFERENCES users(id) ON DELETE CASCADE,
                               CONSTRAINT fk_saved_recipe FOREIGN KEY (recipe_id)
                                   REFERENCES recipes(id) ON DELETE CASCADE
);


CREATE TABLE journal_entries (
                                 id                  BIGINT          AUTO_INCREMENT PRIMARY KEY,
                                 user_id             BIGINT          NOT NULL,
                                 date                DATE            NOT NULL,
                                 meal_type           VARCHAR(15)     NOT NULL,
                                 food_id             BIGINT,
                                 recipe_id           BIGINT,
                                 quantity_grams      FLOAT           NOT NULL,
                                 calories_consumed   FLOAT           DEFAULT 0,
                                 protein_consumed    FLOAT           DEFAULT 0,
                                 carbs_consumed      FLOAT           DEFAULT 0,
                                 fat_consumed        FLOAT           DEFAULT 0,
                                 log_source          VARCHAR(20)     NOT NULL,
                                 logged_at           DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
                                 CONSTRAINT fk_journal_user FOREIGN KEY (user_id)
                                     REFERENCES users(id) ON DELETE CASCADE,
                                 CONSTRAINT fk_journal_food FOREIGN KEY (food_id)
                                     REFERENCES foods(id),
                                 CONSTRAINT fk_journal_recipe FOREIGN KEY (recipe_id)
                                     REFERENCES recipes(id)
);


CREATE TABLE meal_logs (
                           id              BIGINT      AUTO_INCREMENT PRIMARY KEY,
                           user_id         BIGINT      NOT NULL,
                           date            DATE        NOT NULL,
                           total_calories  FLOAT       NOT NULL DEFAULT 0,
                           total_protein   FLOAT       NOT NULL DEFAULT 0,
                           total_carbs     FLOAT       NOT NULL DEFAULT 0,
                           total_fat       FLOAT       NOT NULL DEFAULT 0,
                           water_ml        FLOAT       NOT NULL DEFAULT 0,
                           UNIQUE KEY uq_meal_log (user_id, date),
                           CONSTRAINT fk_meal_log_user FOREIGN KEY (user_id)
                               REFERENCES users(id) ON DELETE CASCADE
);


CREATE TABLE hydration_logs (
                                id          BIGINT      AUTO_INCREMENT PRIMARY KEY,
                                user_id     BIGINT      NOT NULL,
                                date        DATE        NOT NULL,
                                total_ml    FLOAT       NOT NULL DEFAULT 0,
                                updated_at  DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                                UNIQUE KEY uq_hydration (user_id, date),
                                CONSTRAINT fk_hydration_user FOREIGN KEY (user_id)
                                    REFERENCES users(id) ON DELETE CASCADE
);


CREATE TABLE weight_logs (
                             id              BIGINT      AUTO_INCREMENT PRIMARY KEY,
                             user_id         BIGINT      NOT NULL,
                             weight_kg       FLOAT       NOT NULL,
                             bmi             FLOAT,
                             recorded_on     DATE        NOT NULL,
                             created_at      DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
                             CONSTRAINT fk_weight_user FOREIGN KEY (user_id)
                                 REFERENCES users(id) ON DELETE CASCADE
);


CREATE TABLE meal_plans (
                            id              BIGINT      AUTO_INCREMENT PRIMARY KEY,
                            user_id         BIGINT      NOT NULL,
                            start_date      DATE        NOT NULL,
                            end_date        DATE        NOT NULL,
                            duration_days   INT         NOT NULL,
                            generated_at    DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
                            CONSTRAINT fk_plan_user FOREIGN KEY (user_id)
                                REFERENCES users(id) ON DELETE CASCADE
);


CREATE TABLE meal_plan_items (
                                 id              BIGINT      AUTO_INCREMENT PRIMARY KEY,
                                 meal_plan_id    BIGINT      NOT NULL,
                                 date            DATE        NOT NULL,
                                 meal_type       VARCHAR(15) NOT NULL,
                                 recipe_id       BIGINT,
                                 food_id         BIGINT,
                                 quantity_grams  FLOAT,
                                 calories        FLOAT,
                                 CONSTRAINT fk_item_plan FOREIGN KEY (meal_plan_id)
                                     REFERENCES meal_plans(id) ON DELETE CASCADE,
                                 CONSTRAINT fk_item_recipe FOREIGN KEY (recipe_id)
                                     REFERENCES recipes(id),
                                 CONSTRAINT fk_item_food FOREIGN KEY (food_id)
                                     REFERENCES foods(id)
);


CREATE TABLE shopping_list_items (
                                     id              BIGINT          AUTO_INCREMENT PRIMARY KEY,
                                     meal_plan_id    BIGINT          NOT NULL,
                                     food_id         BIGINT          NOT NULL,
                                     quantity_grams  FLOAT           NOT NULL,
                                     checked         TINYINT(1)      NOT NULL DEFAULT 0,
                                     CONSTRAINT fk_shopping_plan FOREIGN KEY (meal_plan_id)
                                         REFERENCES meal_plans(id) ON DELETE CASCADE,
                                     CONSTRAINT fk_shopping_food FOREIGN KEY (food_id)
                                         REFERENCES foods(id)
);


CREATE TABLE chat_messages (
                               id          BIGINT          AUTO_INCREMENT PRIMARY KEY,
                               user_id     BIGINT          NOT NULL,
                               role        VARCHAR(15)     NOT NULL,
                               content     TEXT            NOT NULL,
                               sent_at     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
                               CONSTRAINT fk_chat_user FOREIGN KEY (user_id)
                                   REFERENCES users(id) ON DELETE CASCADE
);


CREATE TABLE notifications (
                               id              BIGINT          AUTO_INCREMENT PRIMARY KEY,
                               user_id         BIGINT          NOT NULL,
                               type            VARCHAR(30)     NOT NULL,
                               title           VARCHAR(200)    NOT NULL,
                               body            VARCHAR(500),
                               is_read         TINYINT(1)      NOT NULL DEFAULT 0,
                               scheduled_at    DATETIME,
                               CONSTRAINT fk_notif_user FOREIGN KEY (user_id)
                                   REFERENCES users(id) ON DELETE CASCADE
);


INSERT INTO foods (name, name_ar, category, source, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, fiber_per_100g, nutritional_score, verified) VALUES
                                                                                                                                                                        ('Couscous cuit',        'كسكسي مطبوخ',    'ALGERIAN_DISH',    'MANUAL', 112,  3.8,  23.2, 0.6,  1.4,  'B', 1),
                                                                                                                                                                        ('Chorba frik',          'شربة فريك',       'ALGERIAN_DISH',    'MANUAL', 68,   4.2,  9.1,  1.5,  1.8,  'A', 1),
                                                                                                                                                                        ('Rechta',               'رشتة',            'ALGERIAN_DISH',    'MANUAL', 145,  5.1,  28.3, 1.8,  1.2,  'B', 1),
                                                                                                                                                                        ('Chakchouka',           'شكشوكة',          'ALGERIAN_DISH',    'MANUAL', 95,   4.5,  8.2,  5.1,  2.1,  'A', 1),
                                                                                                                                                                        ('Mhajeb',               'مهاجب',           'ALGERIAN_DISH',    'MANUAL', 280,  7.2,  42.1, 9.3,  2.0,  'C', 1),
                                                                                                                                                                        ('Loubia',               'لوبية',           'ALGERIAN_DISH',    'MANUAL', 88,   5.8,  14.2, 0.8,  5.2,  'A', 1),
                                                                                                                                                                        ('Berkoukes',            'بركوكس',          'ALGERIAN_DISH',    'MANUAL', 125,  4.1,  25.8, 0.9,  1.6,  'B', 1),
                                                                                                                                                                        ('Garantita',            'قرنطيطة',         'ALGERIAN_DISH',    'MANUAL', 185,  8.2,  18.4, 8.9,  2.3,  'C', 1),
                                                                                                                                                                        ('Tajine zitoune',       'طاجين الزيتون',   'ALGERIAN_DISH',    'MANUAL', 210,  18.5, 6.2,  12.8, 1.9,  'B', 1),
                                                                                                                                                                        ('Dolma',                'دولمة',           'ALGERIAN_DISH',    'MANUAL', 155,  7.8,  18.3, 5.9,  2.7,  'B', 1),
                                                                                                                                                                        ('Poulet grillé',        'دجاج مشوي',       'INGREDIENT',       'MANUAL', 165,  31.0, 0.0,  3.6,  0.0,  'A', 1),
                                                                                                                                                                        ('Riz blanc cuit',       'رز مطبوخ',        'INGREDIENT',       'MANUAL', 130,  2.7,  28.2, 0.3,  0.4,  'C', 1),
                                                                                                                                                                        ('Lentilles cuites',     'عدس مطبوخ',       'INGREDIENT',       'MANUAL', 116,  9.0,  20.1, 0.4,  7.9,  'A', 1),
                                                                                                                                                                        ('Oeuf entier',          'بيضة كاملة',      'INGREDIENT',       'MANUAL', 155,  13.0, 1.1,  11.0, 0.0,  'B', 1),
                                                                                                                                                                        ('Pain kesra',           'خبز كسرة',        'ALGERIAN_DISH',    'MANUAL', 265,  8.5,  52.3, 2.1,  2.8,  'C', 1),
                                                                                                                                                                        ('Banane',               'موزة',            'INGREDIENT',       'MANUAL', 89,   1.1,  22.8, 0.3,  2.6,  'A', 1),
                                                                                                                                                                        ('Pomme',                'تفاحة',           'INGREDIENT',       'MANUAL', 52,   0.3,  13.8, 0.2,  2.4,  'A', 1),
                                                                                                                                                                        ('Yaourt nature',        'زبادي طبيعي',     'INGREDIENT',       'MANUAL', 59,   3.5,  4.7,  3.3,  0.0,  'B', 1),
                                                                                                                                                                        ('Amandes',              'لوز',             'HEALTHY_RECIPE',   'MANUAL', 579,  21.2, 21.6, 49.9, 12.5, 'B', 1),
                                                                                                                                                                        ('Dattes',               'تمر',             'INGREDIENT',       'MANUAL', 277,  1.8,  74.9, 0.2,  6.7,  'B', 1);