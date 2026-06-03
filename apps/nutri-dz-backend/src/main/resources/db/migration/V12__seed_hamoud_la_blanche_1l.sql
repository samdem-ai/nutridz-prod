-- Hamoud La Blanche 1L bottle. Same recipe as the 25cl SKU, different barcode.

INSERT INTO foods (
  name, name_ar, category, source,
  calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g,
  fiber_per_100g, sugar_per_100g, salt_per_100g,
  nutritional_score, barcode, verified
) VALUES (
  'Hamoud La Blanche 1L (Hamoud Boualem)', 'حمود لابلانش 1ل',
  'PACKAGED_PRODUCT', 'MANUAL',
  41.0, 0.0, 10.3, 0.0,
  0.0, 10.2, 0.030,
  'D', '6130695111348', 1
);

INSERT INTO food_serving_sizes (food_id, label, grams)
SELECT id, 'Bouteille 1L', 1000 FROM foods WHERE barcode = '6130695111348';

INSERT INTO food_serving_sizes (food_id, label, grams)
SELECT id, 'Verre 25cl',    250  FROM foods WHERE barcode = '6130695111348';
