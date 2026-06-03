-- Hamoud Boualem soft drinks (25cl bottles). Nutrition per 100 ml
-- (≈100 g for soft drinks). Source: on-pack labels.

INSERT INTO foods (
  name, name_ar, category, source,
  calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g,
  fiber_per_100g, sugar_per_100g, salt_per_100g,
  nutritional_score, barcode, verified
) VALUES (
  'Hamoud La Blanche 25cl (Hamoud Boualem)', 'حمود لابلانش 25سل',
  'PACKAGED_PRODUCT', 'MANUAL',
  41.0, 0.0, 10.3, 0.0,
  0.0, 10.2, 0.030,
  'D', '6130695113915', 1
);

INSERT INTO foods (
  name, name_ar, category, source,
  calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g,
  fiber_per_100g, sugar_per_100g, salt_per_100g,
  nutritional_score, barcode, verified
) VALUES (
  'Selecto 25cl (Hamoud Boualem)', 'سيلكتو 25سل',
  'PACKAGED_PRODUCT', 'MANUAL',
  41.0, 0.0, 10.3, 0.0,
  0.0, 10.2, 0.030,
  'D', '6130695113939', 1
);

-- 250 ml serving size for each
INSERT INTO food_serving_sizes (food_id, label, grams)
SELECT id, 'Bouteille 25cl', 250 FROM foods WHERE barcode = '6130695113915';

INSERT INTO food_serving_sizes (food_id, label, grams)
SELECT id, 'Bouteille 25cl', 250 FROM foods WHERE barcode = '6130695113939';
