-- Replace placeholder Unsplash images on seeded recipes with dish-accurate ones.
-- Uses Wikimedia Commons Special:FilePath (auto-resolves to current file revision).

UPDATE recipes
SET image_url = 'https://commons.wikimedia.org/wiki/Special:FilePath/Couscous.JPG?width=800'
WHERE title = 'Couscous traditionnel aux légumes';

UPDATE recipes
SET image_url = 'https://commons.wikimedia.org/wiki/Special:FilePath/Chorba_frik.jpg?width=800'
WHERE title = 'Chorba Frik';

UPDATE recipes
SET image_url = 'https://commons.wikimedia.org/wiki/Special:FilePath/Shakshouka.jpg?width=800'
WHERE title = 'Chakchouka aux œufs';

UPDATE recipes
SET image_url = 'https://commons.wikimedia.org/wiki/Special:FilePath/Salade_m%C3%A9chouia_(Tunisia).jpg?width=800'
WHERE title = 'Salade Mechouia';

UPDATE recipes
SET image_url = 'https://commons.wikimedia.org/wiki/Special:FilePath/Tajine_zeitoun.jpg?width=800'
WHERE title = 'Tajine zitoune au poulet';

UPDATE recipes
SET image_url = 'https://commons.wikimedia.org/wiki/Special:FilePath/Brik.jpg?width=800'
WHERE title = 'Bourek viande hachée';

UPDATE recipes
SET image_url = 'https://commons.wikimedia.org/wiki/Special:FilePath/Loubia_bel_kemmoun.jpg?width=800'
WHERE title = 'Loubia (haricots blancs)';

UPDATE recipes
SET image_url = 'https://commons.wikimedia.org/wiki/Special:FilePath/Mhadjeb.jpg?width=800'
WHERE title = 'Mhajeb farci';
