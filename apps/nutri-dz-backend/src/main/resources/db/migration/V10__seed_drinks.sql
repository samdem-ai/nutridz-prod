-- Seed common drinks so AI vision detections ("Eau", "The", "Cafe", "Lait", "L'ben", "Jus de fruit")
-- map to a real verified food row instead of falling through to a substring-match on the foods table
-- (e.g. "Eau" was matching "Gateau" inside Algerian pastry names).

INSERT INTO foods (name, name_ar, category, source, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, fiber_per_100g, sugar_per_100g, salt_per_100g, nutritional_score, verified) VALUES
('Eau',          'ماء',    'INGREDIENT', 'MANUAL',  0,   0,    0,    0,   0,   0,    0,    'A', 1),
('The',          'شاي',    'INGREDIENT', 'MANUAL',  1,   0,    0.2,  0,   0,   0,    0,    'A', 1),
('Cafe',         'قهوة',   'INGREDIENT', 'MANUAL',  2,   0.1,  0,    0,   0,   0,    0,    'A', 1),
('Lait',         'حليب',   'INGREDIENT', 'MANUAL',  50,  3.3,  4.8,  1.8, 0,   4.8,  0.05, 'B', 1),
('L''ben',       'لبن',    'INGREDIENT', 'MANUAL',  40,  3.5,  4.5,  1.0, 0,   4.5,  0.05, 'B', 1),
('Jus de fruit', 'عصير',   'INGREDIENT', 'MANUAL',  45,  0.5,  11.0, 0.1, 0.1, 10.0, 0.01, 'C', 1);
