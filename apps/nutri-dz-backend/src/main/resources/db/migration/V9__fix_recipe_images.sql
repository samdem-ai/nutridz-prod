-- V8 used some non-existent Wikimedia filenames (couscous/chakchouka 404,
-- bourek pointed to Tunisian Brik). Replace with verified Algerian-specific files.

UPDATE recipes
SET image_url = 'https://commons.wikimedia.org/wiki/Special:FilePath/Algerian_couscous_from_Kabylia.jpg?width=800'
WHERE title = 'Couscous traditionnel aux légumes';

UPDATE recipes
SET image_url = 'https://commons.wikimedia.org/wiki/Special:FilePath/Chorba_frik_algerienne.jpg?width=800'
WHERE title = 'Chorba Frik';

UPDATE recipes
SET image_url = 'https://commons.wikimedia.org/wiki/Special:FilePath/Shakshuka.jpg?width=800'
WHERE title = 'Chakchouka aux œufs';

UPDATE recipes
SET image_url = 'https://commons.wikimedia.org/wiki/Special:FilePath/SaladeMechouia_2013.JPG?width=800'
WHERE title = 'Salade Mechouia';

UPDATE recipes
SET image_url = 'https://commons.wikimedia.org/wiki/Special:FilePath/Tajine_poulet_olives.jpg?width=800'
WHERE title = 'Tajine zitoune au poulet';

-- IMPORTANT: V8 pointed to Brik.jpg (Tunisian) — wrong dish. Algerian bourek.
UPDATE recipes
SET image_url = 'https://commons.wikimedia.org/wiki/Special:FilePath/Bourek_alg%C3%A9rien.jpg?width=800'
WHERE title = 'Bourek viande hachée';

UPDATE recipes
SET image_url = 'https://commons.wikimedia.org/wiki/Special:FilePath/Fasolada.JPG?width=800'
WHERE title = 'Loubia (haricots blancs)';

UPDATE recipes
SET image_url = 'https://commons.wikimedia.org/wiki/Special:FilePath/Mhadjeb.jpg?width=800'
WHERE title = 'Mhajeb farci';
