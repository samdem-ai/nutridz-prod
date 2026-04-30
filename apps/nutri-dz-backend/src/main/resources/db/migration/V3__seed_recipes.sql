-- Seed user (system author for sample recipes)
INSERT INTO users (id, username, email, password_hash, role)
VALUES (999, 'nutridz_chef', 'chef@nutridz.com', 'system', 'ADMIN');

-- Sample Algerian recipes for community feed
INSERT INTO recipes (author_id, title, title_ar, description, image_url, prep_time_minutes, servings, calories_per_serving, protein_per_serving, carbs_per_serving, fat_per_serving, category, is_algerian, is_public, likes_count) VALUES
(999, 'Couscous traditionnel aux légumes', 'كسكس بالخضر', 'Le plat emblématique de l''Algérie. Semoule fine, légumes de saison et viande tendre. Riche en fibres et nutriments.', 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=800', 60, 6, 420, 18, 65, 10, 'ALGERIAN', 1, 1, 24),
(999, 'Chorba Frik', 'شربة فريك', 'Soupe traditionnelle au blé concassé, tomate et coriandre. Parfaite pour le ramadan ou les soirées d''hiver.', 'https://images.unsplash.com/photo-1547592180-85f173990554?w=800', 45, 4, 280, 14, 38, 8, 'ALGERIAN', 1, 1, 18),
(999, 'Chakchouka aux œufs', 'شكشوكة', 'Poêlée de poivrons, tomates et oignons mijotés, surmontée d''œufs pochés. Petit-déjeuner ou dîner sain.', 'https://images.unsplash.com/photo-1590412200988-a436970781fa?w=800', 25, 2, 320, 16, 22, 18, 'HEALTHY', 1, 1, 32),
(999, 'Salade Mechouia', 'سلطة مشوية', 'Salade grillée de poivrons, tomates, ail et huile d''olive. Légère et pleine de saveurs fumées.', 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800', 30, 4, 110, 3, 12, 6, 'WEIGHT_LOSS', 1, 1, 15),
(999, 'Tajine zitoune au poulet', 'طاجين الزيتون بالدجاج', 'Poulet mijoté aux olives vertes, citron confit et épices. Plat parfumé et nourrissant.', 'https://images.unsplash.com/photo-1535473895227-bdecb20fb157?w=800', 50, 4, 380, 32, 8, 22, 'ALGERIAN', 1, 1, 21),
(999, 'Bourek viande hachée', 'بريك باللحم', 'Feuilles de brick croustillantes farcies de viande hachée et épices. Entrée de fête.', 'https://images.unsplash.com/photo-1625938145744-e380515399b7?w=800', 35, 6, 245, 12, 22, 12, 'ALGERIAN', 1, 1, 19),
(999, 'Loubia (haricots blancs)', 'اللوبية', 'Haricots blancs mijotés en sauce tomate épicée. Riche en protéines végétales et fibres.', 'https://images.unsplash.com/photo-1588566565463-180a5b2090d2?w=800', 40, 4, 290, 18, 42, 6, 'HEALTHY', 1, 1, 12),
(999, 'Mhajeb farci', 'محاجب', 'Crêpes feuilletées algériennes farcies à la tomate, poivron et oignon. Street food incontournable.', 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800', 45, 4, 310, 7, 48, 10, 'ALGERIAN', 1, 1, 28);
