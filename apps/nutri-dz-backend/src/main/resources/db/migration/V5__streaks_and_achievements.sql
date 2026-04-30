-- Streaks: track consecutive days with at least one journal entry
CREATE TABLE user_streaks (
    user_id          BIGINT          PRIMARY KEY,
    current_streak   INT             NOT NULL DEFAULT 0,
    longest_streak   INT             NOT NULL DEFAULT 0,
    last_log_date    DATE            NULL,
    updated_at       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_streak_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Achievements catalog (static)
CREATE TABLE achievements (
    id           VARCHAR(50)     PRIMARY KEY,
    title        VARCHAR(100)    NOT NULL,
    description  VARCHAR(255)    NOT NULL,
    icon         VARCHAR(50)     NOT NULL,
    category     VARCHAR(30)     NOT NULL,
    threshold    INT             NOT NULL DEFAULT 0
);

-- Unlocked achievements per user
CREATE TABLE user_achievements (
    user_id        BIGINT         NOT NULL,
    achievement_id VARCHAR(50)    NOT NULL,
    unlocked_at    DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, achievement_id),
    CONSTRAINT fk_ua_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_ua_ach FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE
);

-- Seed achievement catalog
INSERT INTO achievements (id, title, description, icon, category, threshold) VALUES
('first_log', 'Premier pas', 'Ajouter ton premier aliment au journal', 'restaurant', 'JOURNAL', 1),
('logs_10', 'Habituel', 'Ajouter 10 aliments au journal', 'nutrition', 'JOURNAL', 10),
('logs_50', 'Connaisseur', 'Ajouter 50 aliments au journal', 'star', 'JOURNAL', 50),
('logs_100', 'Centenaire', 'Ajouter 100 aliments au journal', 'medal', 'JOURNAL', 100),
('streak_3', '3 jours de suite', 'Logger pendant 3 jours consécutifs', 'flame', 'STREAK', 3),
('streak_7', 'Semaine parfaite', 'Logger 7 jours consécutifs', 'flame', 'STREAK', 7),
('streak_30', 'Mois de feu', 'Logger 30 jours consécutifs', 'trophy', 'STREAK', 30),
('streak_100', 'Légende', '100 jours consécutifs', 'rocket', 'STREAK', 100),
('hydro_5', 'Hydratation', 'Atteindre objectif eau 5 jours', 'water', 'HYDRATION', 5),
('hydro_30', 'Source vive', 'Atteindre objectif eau 30 jours', 'water', 'HYDRATION', 30),
('weight_log', 'Suivi poids', 'Premier enregistrement de poids', 'scale', 'WEIGHT', 1),
('weight_5', 'Régulier', 'Enregistrer poids 5 fois', 'fitness', 'WEIGHT', 5),
('photo_1', 'Photographe', 'Première analyse photo IA', 'camera', 'AI', 1),
('photo_10', 'Reporter', '10 analyses photo IA', 'images', 'AI', 10),
('chat_1', 'Curieux', 'Premier message au chat IA', 'chatbubble', 'CHAT', 1),
('recipe_share', 'Chef partageur', 'Publier ta première recette', 'book', 'COMMUNITY', 1),
('recipe_liked', 'Apprécié', 'Recevoir 10 likes sur une recette', 'heart', 'COMMUNITY', 10),
('algerian_5', 'Cuisine du bled', 'Logger 5 plats algériens', 'flag', 'ALGERIAN', 5),
('barcode_5', 'Scan master', 'Scanner 5 codes-barres', 'barcode', 'AI', 5),
('plan_1', 'Planificateur', 'Générer ton premier plan repas', 'calendar', 'PLAN', 1);
