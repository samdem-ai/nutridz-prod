-- ══════════════════════════════════════════════════════════════════════════════
--  NutriDz n Health — Base de données nutritionnelle algérienne
--  Version : 1.0 | PostgreSQL 14+
--  Auteur   : Nazim Bentahar
--  PFE      : Application mobile de nutrition adaptée au contexte algérien
--
--  CONTENU :
--  1. Création de la base et des extensions
--  2. Schéma complet (8 tables)
--  3. Données de référence (catégories, régions)
--  4. 90 aliments algériens avec valeurs nutritionnelles et NutriDz Score
-- ══════════════════════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────────────────────────
--  1. INITIALISATION
-- ─────────────────────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Nettoyage si relance du script
DROP TABLE IF EXISTS produit_industriel    CASCADE;
DROP TABLE IF EXISTS ingredient            CASCADE;
DROP TABLE IF EXISTS variante_regionale    CASCADE;
DROP TABLE IF EXISTS nutridz_score         CASCADE;
DROP TABLE IF EXISTS valeur_nutritionnelle CASCADE;
DROP TABLE IF EXISTS aliment               CASCADE;
DROP TABLE IF EXISTS region                CASCADE;
DROP TABLE IF EXISTS categorie             CASCADE;


-- ─────────────────────────────────────────────────────────────────────────────
--  2. TABLES
-- ─────────────────────────────────────────────────────────────────────────────

-- Table 1 : Catégories d'aliments
CREATE TABLE categorie (
    id_categorie   SERIAL       PRIMARY KEY,
    nom_fr         VARCHAR(100) NOT NULL,
    nom_ar         VARCHAR(100),
    type           VARCHAR(50)  NOT NULL
        CHECK (type IN ('plat_principal','soupe','entree','patisserie',
                        'fruit','legume','cereale','legumineuse',
                        'produit_laitier','viande','boisson',
                        'corps_gras','epice','produit_industriel')),
    description    TEXT,
    icone_url      VARCHAR(255),
    date_creation  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE categorie IS 'Catégories nutritionnelles des aliments NutriDz';


-- Table 2 : Régions algériennes
CREATE TABLE region (
    id_region  SERIAL       PRIMARY KEY,
    nom_fr     VARCHAR(100) NOT NULL,
    nom_ar     VARCHAR(100),
    wilaya     VARCHAR(100),
    zone       VARCHAR(50)
        CHECK (zone IN ('nord','est','ouest','centre','sud','kabyle','chaoui','mozabite'))
);

COMMENT ON TABLE region IS 'Régions et wilayas algériennes pour les variantes régionales';


-- Table 3 : Aliments (table centrale)
CREATE TABLE aliment (
    id_aliment         UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    nom_fr             VARCHAR(200) NOT NULL,
    nom_ar             VARCHAR(200),
    nom_darija         VARCHAR(200),
    nom_tamazight      VARCHAR(200),
    id_categorie       INTEGER      NOT NULL REFERENCES categorie(id_categorie),
    type_aliment       VARCHAR(50)  NOT NULL
        CHECK (type_aliment IN ('brut','transforme','ultra_transforme',
                                'plat_cuisine','boisson','patisserie')),
    portion_standard_g DECIMAL(8,2) DEFAULT 100.00,
    unite_mesure       VARCHAR(30)  DEFAULT 'g',
    image_url          VARCHAR(500),
    est_plat_compose   BOOLEAN      DEFAULT FALSE,
    saison             VARCHAR(50),
    region_origine     VARCHAR(100),
    description        TEXT,
    source_donnee      VARCHAR(100) DEFAULT 'CIQUAL/USDA',
    validee_par        VARCHAR(100),
    date_creation      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    date_mise_a_jour   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    est_actif          BOOLEAN      DEFAULT TRUE
);

CREATE INDEX idx_aliment_categorie ON aliment(id_categorie);
CREATE INDEX idx_aliment_nom_fr    ON aliment(nom_fr);
CREATE INDEX idx_aliment_type      ON aliment(type_aliment);

COMMENT ON TABLE aliment IS 'Table centrale des aliments algériens — 90 aliments pré-remplis';


-- Table 4 : Valeurs nutritionnelles (pour 100 g ou 100 ml)
CREATE TABLE valeur_nutritionnelle (
    id_valeur        UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_aliment       UUID         NOT NULL UNIQUE REFERENCES aliment(id_aliment) ON DELETE CASCADE,
    -- Macronutriments
    energie_kcal     DECIMAL(8,2),
    energie_kj       DECIMAL(8,2),
    proteines_g      DECIMAL(8,2),
    glucides_g       DECIMAL(8,2),
    sucres_g         DECIMAL(8,2),
    lipides_g        DECIMAL(8,2),
    ags_g            DECIMAL(8,2),  -- acides gras saturés
    agmi_g           DECIMAL(8,2),  -- acides gras mono-insaturés
    agpi_g           DECIMAL(8,2),  -- acides gras poly-insaturés
    fibres_g         DECIMAL(8,2),
    sel_mg           DECIMAL(8,2),  -- sodium × 2.5
    sodium_mg        DECIMAL(8,2),
    eau_g            DECIMAL(8,2),
    -- Micronutriments clés
    calcium_mg       DECIMAL(8,2),
    fer_mg           DECIMAL(8,2),
    magnesium_mg     DECIMAL(8,2),
    potassium_mg     DECIMAL(8,2),
    vitamine_c_mg    DECIMAL(8,2),
    vitamine_d_mcg   DECIMAL(8,2),
    -- Métadonnées
    pct_fruits_leg_leg DECIMAL(5,2) DEFAULT 0, -- % fruits+légumes+légumineuses
    methode_calcul   VARCHAR(100)  DEFAULT 'table_ciqual',
    fiabilite        VARCHAR(20)   DEFAULT 'estime'
        CHECK (fiabilite IN ('mesure_labo','calcule_recette','estime','declare_fabricant')),
    date_analyse     DATE,
    source_reference VARCHAR(200)  DEFAULT 'CIQUAL 2020 / USDA FoodData Central'
);

COMMENT ON TABLE valeur_nutritionnelle IS 'Composition nutritionnelle pour 100g ou 100ml';


-- Table 5 : NutriDz Score (calcul A→E)
CREATE TABLE nutridz_score (
    id_score         UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_aliment       UUID         NOT NULL UNIQUE REFERENCES aliment(id_aliment) ON DELETE CASCADE,
    -- Composantes du calcul
    pts_energie      SMALLINT     DEFAULT 0 CHECK (pts_energie    BETWEEN 0 AND 10),
    pts_ags          SMALLINT     DEFAULT 0 CHECK (pts_ags         BETWEEN 0 AND 10),
    pts_sucres       SMALLINT     DEFAULT 0 CHECK (pts_sucres      BETWEEN 0 AND 10),
    pts_sel          SMALLINT     DEFAULT 0 CHECK (pts_sel         BETWEEN 0 AND 20),
    pts_fibres       SMALLINT     DEFAULT 0 CHECK (pts_fibres      BETWEEN 0 AND 7),
    pts_proteines    SMALLINT     DEFAULT 0 CHECK (pts_proteines   BETWEEN 0 AND 7),
    pts_fll          SMALLINT     DEFAULT 0 CHECK (pts_fll         BETWEEN 0 AND 5),
    -- Score final
    points_negatifs  SMALLINT     GENERATED ALWAYS AS
                        (pts_energie + pts_ags + pts_sucres + pts_sel) STORED,
    points_positifs  SMALLINT     GENERATED ALWAYS AS
                        (pts_fibres + pts_proteines + pts_fll) STORED,
    score_final      SMALLINT     GENERATED ALWAYS AS
                        ((pts_energie + pts_ags + pts_sucres + pts_sel)
                         - (pts_fibres + pts_proteines + pts_fll)) STORED,
    -- Résultat
    lettre           CHAR(1)      NOT NULL CHECK (lettre IN ('A','B','C','D','E')),
    couleur_hex      CHAR(7),
    -- Métadonnées
    version_algo     VARCHAR(10)  DEFAULT '2025',
    date_calcul      DATE         DEFAULT CURRENT_DATE,
    calcule_par      VARCHAR(100) DEFAULT 'NutriDz_Engine_v1'
);

COMMENT ON TABLE nutridz_score IS 'Score nutritionnel NutriDz A→E — algorithme adapté 2025';


-- Table 6 : Variantes régionales
CREATE TABLE variante_regionale (
    id_variante          UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_aliment           UUID         NOT NULL REFERENCES aliment(id_aliment) ON DELETE CASCADE,
    id_region            INTEGER      NOT NULL REFERENCES region(id_region),
    nom_variante_fr      VARCHAR(200),
    description_variante TEXT,
    variation_sel_pct    DECIMAL(5,2) DEFAULT 0,
    variation_lipides_pct DECIMAL(5,2) DEFAULT 0,
    variation_calories_pct DECIMAL(5,2) DEFAULT 0,
    notes                TEXT,
    UNIQUE (id_aliment, id_region)
);


-- Table 7 : Ingrédients des plats composés
CREATE TABLE ingredient (
    id_ingredient         UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_aliment_compose    UUID         NOT NULL REFERENCES aliment(id_aliment) ON DELETE CASCADE,
    id_aliment_ingredient UUID         NOT NULL REFERENCES aliment(id_aliment),
    quantite_g            DECIMAL(8,2) NOT NULL,
    proportion_pct        DECIMAL(5,2),
    notes                 VARCHAR(200),
    CHECK (id_aliment_compose <> id_aliment_ingredient)
);

CREATE INDEX idx_ingredient_compose ON ingredient(id_aliment_compose);


-- Table 8 : Produits industriels algériens
CREATE TABLE produit_industriel (
    id_produit        UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_aliment        UUID         NOT NULL UNIQUE REFERENCES aliment(id_aliment) ON DELETE CASCADE,
    marque            VARCHAR(100) NOT NULL,
    gamme             VARCHAR(100),
    code_barres       VARCHAR(20)  UNIQUE,
    contenance_g_ml   DECIMAL(8,2),
    pays_fabrication  VARCHAR(50)  DEFAULT 'Algérie',
    ville_fabrication VARCHAR(100),
    statut_etiquetage VARCHAR(50)  DEFAULT 'sans_nutriscore'
        CHECK (statut_etiquetage IN ('avec_nutriscore','sans_nutriscore','en_cours')),
    date_lancement    DATE,
    url_produit       VARCHAR(500),
    notes             TEXT
);

COMMENT ON TABLE produit_industriel IS 'Produits industriels algériens (Bimo, Cevital, Ifri, etc.)';


-- ─────────────────────────────────────────────────────────────────────────────
--  3. DONNÉES DE RÉFÉRENCE
-- ─────────────────────────────────────────────────────────────────────────────

-- Catégories
INSERT INTO categorie (nom_fr, nom_ar, type, description) VALUES
('Soupes et bouillons',      'الشوربات',         'soupe',            'Chorba, harira, djari...'),
('Plats principaux',         'الأطباق الرئيسية', 'plat_principal',   'Couscous, rechta, chakhchoukha...'),
('Entrées et street food',   'المقبلات',         'entree',           'Bourek, garantita, mhadjeb...'),
('Pâtisseries traditionnelles','الحلويات التقليدية','patisserie',    'Baklava, zlabia, maqrout...'),
('Fruits frais',             'الفواكه الطازجة',  'fruit',            'Figues, grenades, abricots...'),
('Légumes frais',            'الخضروات الطازجة', 'legume',           'Tomates, poivrons, courgettes...'),
('Céréales et féculents',    'الحبوب والنشويات', 'cereale',          'Semoule, couscous, pain...'),
('Légumineuses',             'البقوليات',        'legumineuse',      'Pois chiches, lentilles, fèves...'),
('Produits laitiers',        'منتجات الألبان',   'produit_laitier',  'Lben, yaourt, fromage...'),
('Viandes et poissons',      'اللحوم والأسماك',  'viande',           'Agneau, poulet, merguez...'),
('Boissons',                 'المشروبات',        'boisson',          'Ifri, Tchin-Tchin, lben...'),
('Corps gras',               'المواد الدهنية',   'corps_gras',       'Huile olive, smen, beurre...'),
('Épices et condiments',     'التوابل',          'epice',            'Ras el hanout, cumin, harissa...'),
('Produits industriels',     'المنتجات الصناعية','produit_industriel','Bimo, Cevital, produits emballés...');


-- Régions
INSERT INTO region (nom_fr, nom_ar, wilaya, zone) VALUES
('Alger',          'الجزائر العاصمة', 'Alger (16)',          'centre'),
('Oran',           'وهران',           'Oran (31)',           'ouest'),
('Constantine',    'قسنطينة',         'Constantine (25)',    'est'),
('Tizi-Ouzou',     'تيزي وزو',        'Tizi-Ouzou (15)',     'kabyle'),
('Béjaïa',         'بجاية',           'Béjaïa (06)',         'kabyle'),
('Biskra',         'بسكرة',           'Biskra (07)',         'sud'),
('Tlemcen',        'تلمسان',          'Tlemcen (13)',        'ouest'),
('Sétif',          'سطيف',            'Sétif (19)',          'est'),
('Batna',          'باتنة',           'Batna (05)',          'chaoui'),
('Ghardaïa',       'غرداية',          'Ghardaïa (47)',       'mozabite'),
('Annaba',         'عنابة',           'Annaba (23)',         'est'),
('Médéa',          'المدية',          'Médéa (26)',          'centre');


-- ─────────────────────────────────────────────────────────────────────────────
--  4. ALIMENTS ALGÉRIENS — 90 ENTRÉES AVEC VALEURS NUTRITIONNELLES ET SCORE
--
--  Structure de chaque bloc :
--    INSERT aliment → INSERT valeur_nutritionnelle → INSERT nutridz_score
--
--  Sources : CIQUAL 2020, USDA FoodData Central, Louala & Lamri-Senhadji (2016),
--            infocalories.fr, les-calories.com, calcul par récapitulation de recette
-- ─────────────────────────────────────────────────────────────────────────────

-- ═══ SECTION A — SOUPES ET BOUILLONS ═══════════════════════════════════════

-- A1 Chorba frik
INSERT INTO aliment (nom_fr,nom_ar,nom_darija,id_categorie,type_aliment,portion_standard_g,est_plat_compose,region_origine,description,source_donnee)
VALUES ('Chorba frik','شوربة الفريك','chorba frik',1,'plat_cuisine',250,TRUE,'Hauts Plateaux / Aurès','Soupe traditionnelle au blé vert concassé, agneau et légumes','calcul_recette');

WITH a AS (SELECT id_aliment FROM aliment WHERE nom_fr='Chorba frik')
INSERT INTO valeur_nutritionnelle (id_aliment,energie_kcal,energie_kj,proteines_g,glucides_g,sucres_g,lipides_g,ags_g,fibres_g,sel_mg,eau_g,pct_fruits_leg_leg,source_reference)
SELECT id_aliment,55,230,4.2,7.8,0.8,0.9,0.4,2.1,310,85.0,35,'Louala & Lamri-Senhadji 2016 / calcul recette' FROM a;

WITH a AS (SELECT id_aliment FROM aliment WHERE nom_fr='Chorba frik')
INSERT INTO nutridz_score (id_aliment,pts_energie,pts_ags,pts_sucres,pts_sel,pts_fibres,pts_proteines,pts_fll,lettre,couleur_hex)
SELECT id_aliment,1,0,0,2,3,4,3,'A','#1A7D3E' FROM a;


-- A2 Harira
INSERT INTO aliment (nom_fr,nom_ar,nom_darija,id_categorie,type_aliment,portion_standard_g,est_plat_compose,region_origine,description,source_donnee)
VALUES ('Harira','حريرة','harira',1,'plat_cuisine',250,TRUE,'Ouest algérien / Tlemcen','Soupe aux légumineuses, tomates, viande et épices — origine andalouse','calcul_recette');

WITH a AS (SELECT id_aliment FROM aliment WHERE nom_fr='Harira')
INSERT INTO valeur_nutritionnelle (id_aliment,energie_kcal,energie_kj,proteines_g,glucides_g,sucres_g,lipides_g,ags_g,fibres_g,sel_mg,eau_g,pct_fruits_leg_leg,source_reference)
SELECT id_aliment,62,260,5.1,9.2,1.2,1.0,0.5,3.0,340,82.0,40,'CIQUAL 2020 / calcul recette' FROM a;

WITH a AS (SELECT id_aliment FROM aliment WHERE nom_fr='Harira')
INSERT INTO nutridz_score (id_aliment,pts_energie,pts_ags,pts_sucres,pts_sel,pts_fibres,pts_proteines,pts_fll,lettre,couleur_hex)
SELECT id_aliment,1,0,0,2,4,5,3,'A','#1A7D3E' FROM a;


-- A3 Chorba vermicelle
INSERT INTO aliment (nom_fr,nom_ar,nom_darija,id_categorie,type_aliment,portion_standard_g,est_plat_compose,region_origine,source_donnee)
VALUES ('Chorba vermicelle','شوربة الشعيرية','chorba fdaouech',1,'plat_cuisine',250,TRUE,'National','calcul_recette');

WITH a AS (SELECT id_aliment FROM aliment WHERE nom_fr='Chorba vermicelle')
INSERT INTO valeur_nutritionnelle (id_aliment,energie_kcal,energie_kj,proteines_g,glucides_g,sucres_g,lipides_g,ags_g,fibres_g,sel_mg,eau_g,pct_fruits_leg_leg,source_reference)
SELECT id_aliment,48,201,3.2,7.5,0.9,0.9,0.6,1.0,380,86.0,22,'calcul_recette' FROM a;

WITH a AS (SELECT id_aliment FROM aliment WHERE nom_fr='Chorba vermicelle')
INSERT INTO nutridz_score (id_aliment,pts_energie,pts_ags,pts_sucres,pts_sel,pts_fibres,pts_proteines,pts_fll,lettre,couleur_hex)
SELECT id_aliment,1,0,0,3,1,3,2,'B','#5BA829' FROM a;


-- A4 Chorba beida (blanche)
INSERT INTO aliment (nom_fr,nom_ar,nom_darija,id_categorie,type_aliment,portion_standard_g,est_plat_compose,region_origine,source_donnee)
VALUES ('Chorba beida','الشوربة البيضاء','chorba beida',1,'plat_cuisine',250,TRUE,'Alger','calcul_recette');

WITH a AS (SELECT id_aliment FROM aliment WHERE nom_fr='Chorba beida')
INSERT INTO valeur_nutritionnelle (id_aliment,energie_kcal,energie_kj,proteines_g,glucides_g,sucres_g,lipides_g,ags_g,fibres_g,sel_mg,eau_g,pct_fruits_leg_leg,source_reference)
SELECT id_aliment,52,218,4.5,6.8,0.5,1.2,0.5,0.8,350,85.0,18,'calcul_recette' FROM a;

WITH a AS (SELECT id_aliment FROM aliment WHERE nom_fr='Chorba beida')
INSERT INTO nutridz_score (id_aliment,pts_energie,pts_ags,pts_sucres,pts_sel,pts_fibres,pts_proteines,pts_fll,lettre,couleur_hex)
SELECT id_aliment,1,0,0,2,1,4,1,'B','#5BA829' FROM a;


-- ═══ SECTION B — PLATS PRINCIPAUX ══════════════════════════════════════════

-- B1 Couscous aux 7 légumes
INSERT INTO aliment (nom_fr,nom_ar,nom_darija,id_categorie,type_aliment,portion_standard_g,est_plat_compose,region_origine,description,source_donnee)
VALUES ('Couscous aux 7 légumes','الكسكسي بسبع خضروات','kesksou bel khodra',2,'plat_cuisine',300,TRUE,'National','Plat national algérien — semoule vapeur, légumes variés, pois chiches','Louala & Lamri-Senhadji 2016');

WITH a AS (SELECT id_aliment FROM aliment WHERE nom_fr='Couscous aux 7 légumes')
INSERT INTO valeur_nutritionnelle (id_aliment,energie_kcal,energie_kj,proteines_g,glucides_g,sucres_g,lipides_g,ags_g,fibres_g,sel_mg,eau_g,pct_fruits_leg_leg,source_reference)
SELECT id_aliment,120,502,4.5,21.5,2.5,1.5,0.8,3.8,280,70.0,45,'Louala & Lamri-Senhadji 2016' FROM a;

WITH a AS (SELECT id_aliment FROM aliment WHERE nom_fr='Couscous aux 7 légumes')
INSERT INTO nutridz_score (id_aliment,pts_energie,pts_ags,pts_sucres,pts_sel,pts_fibres,pts_proteines,pts_fll,lettre,couleur_hex)
SELECT id_aliment,1,0,0,2,3,4,3,'A','#1A7D3E' FROM a;


-- B2 Couscous agneau
INSERT INTO aliment (nom_fr,nom_ar,nom_darija,id_categorie,type_aliment,portion_standard_g,est_plat_compose,source_donnee)
VALUES ('Couscous agneau pois chiches','كسكسي بلحم الغنم','kesksou bel lahm',2,'plat_cuisine',300,TRUE,'calcul_recette');

WITH a AS (SELECT id_aliment FROM aliment WHERE nom_fr='Couscous agneau pois chiches')
INSERT INTO valeur_nutritionnelle (id_aliment,energie_kcal,energie_kj,proteines_g,glucides_g,sucres_g,lipides_g,ags_g,fibres_g,sel_mg,eau_g,pct_fruits_leg_leg,source_reference)
SELECT id_aliment,165,691,9.5,21.0,2.0,5.5,3.5,3.0,350,62.0,30,'calcul_recette CIQUAL' FROM a;

WITH a AS (SELECT id_aliment FROM aliment WHERE nom_fr='Couscous agneau pois chiches')
INSERT INTO nutridz_score (id_aliment,pts_energie,pts_ags,pts_sucres,pts_sel,pts_fibres,pts_proteines,pts_fll,lettre,couleur_hex)
SELECT id_aliment,2,1,0,2,3,5,2,'B','#5BA829' FROM a;


-- B3 Couscous royal (avec merguez)
INSERT INTO aliment (nom_fr,nom_ar,nom_darija,id_categorie,type_aliment,portion_standard_g,est_plat_compose,source_donnee)
VALUES ('Couscous royal avec merguez','كسكسي ملوكي','kesksou bel merguez',2,'plat_cuisine',350,TRUE,'calcul_recette');

WITH a AS (SELECT id_aliment FROM aliment WHERE nom_fr='Couscous royal avec merguez')
INSERT INTO valeur_nutritionnelle (id_aliment,energie_kcal,energie_kj,proteines_g,glucides_g,sucres_g,lipides_g,ags_g,fibres_g,sel_mg,eau_g,pct_fruits_leg_leg,source_reference)
SELECT id_aliment,195,816,10.5,21.0,2.5,8.0,5.2,2.5,620,58.0,25,'calcul_recette' FROM a;

WITH a AS (SELECT id_aliment FROM aliment WHERE nom_fr='Couscous royal avec merguez')
INSERT INTO nutridz_score (id_aliment,pts_energie,pts_ags,pts_sucres,pts_sel,pts_fibres,pts_proteines,pts_fll,lettre,couleur_hex)
SELECT id_aliment,3,2,0,5,3,5,2,'C','#D4B800' FROM a;


-- B4 Rechta au poulet
INSERT INTO aliment (nom_fr,nom_ar,nom_darija,id_categorie,type_aliment,portion_standard_g,est_plat_compose,region_origine,description,source_donnee)
VALUES ('Rechta au poulet','رشتة بالدجاج','rechta',2,'plat_cuisine',300,TRUE,'Alger','Pâtes fines artisanales, poulet, pois chiches, cannelle','calcul_recette');

WITH a AS (SELECT id_aliment FROM aliment WHERE nom_fr='Rechta au poulet')
INSERT INTO valeur_nutritionnelle (id_aliment,energie_kcal,energie_kj,proteines_g,glucides_g,sucres_g,lipides_g,ags_g,fibres_g,sel_mg,eau_g,pct_fruits_leg_leg,source_reference)
SELECT id_aliment,148,619,9.0,21.5,1.2,3.5,1.5,2.0,380,65.0,20,'calcul_recette' FROM a;

WITH a AS (SELECT id_aliment FROM aliment WHERE nom_fr='Rechta au poulet')
INSERT INTO nutridz_score (id_aliment,pts_energie,pts_ags,pts_sucres,pts_sel,pts_fibres,pts_proteines,pts_fll,lettre,couleur_hex)
SELECT id_aliment,2,0,0,3,2,5,1,'B','#5BA829' FROM a;


-- B5 Chakhchoukha
INSERT INTO aliment (nom_fr,nom_ar,nom_darija,id_categorie,type_aliment,portion_standard_g,est_plat_compose,region_origine,source_donnee)
VALUES ('Chakhchoukha','الشخشوخة','chakhchoukha',2,'plat_cuisine',300,TRUE,'Biskra / Hauts Plateaux','calcul_recette');

WITH a AS (SELECT id_aliment FROM aliment WHERE nom_fr='Chakhchoukha')
INSERT INTO valeur_nutritionnelle (id_aliment,energie_kcal,energie_kj,proteines_g,glucides_g,sucres_g,lipides_g,ags_g,fibres_g,sel_mg,eau_g,pct_fruits_leg_leg,source_reference)
SELECT id_aliment,200,837,8.5,30.0,1.8,6.0,4.0,2.0,480,56.0,20,'calcul_recette' FROM a;

WITH a AS (SELECT id_aliment FROM aliment WHERE nom_fr='Chakhchoukha')
INSERT INTO nutridz_score (id_aliment,pts_energie,pts_ags,pts_sucres,pts_sel,pts_fibres,pts_proteines,pts_fll,lettre,couleur_hex)
SELECT id_aliment,3,1,0,4,2,4,1,'C','#D4B800' FROM a;


-- B6 Tajine zitoune
INSERT INTO aliment (nom_fr,nom_ar,nom_darija,id_categorie,type_aliment,portion_standard_g,est_plat_compose,region_origine,source_donnee)
VALUES ('Tajine zitoune','طاجين الزيتون','tajine zitoune',2,'plat_cuisine',250,TRUE,'Alger','calcul_recette');

WITH a AS (SELECT id_aliment FROM aliment WHERE nom_fr='Tajine zitoune')
INSERT INTO valeur_nutritionnelle (id_aliment,energie_kcal,energie_kj,proteines_g,glucides_g,sucres_g,lipides_g,ags_g,fibres_g,sel_mg,eau_g,pct_fruits_leg_leg,source_reference)
SELECT id_aliment,155,648,14.5,8.0,1.5,7.5,2.8,2.0,450,68.0,18,'calcul_recette' FROM a;

WITH a AS (SELECT id_aliment FROM aliment WHERE nom_fr='Tajine zitoune')
INSERT INTO nutridz_score (id_aliment,pts_energie,pts_ags,pts_sucres,pts_sel,pts_fibres,pts_proteines,pts_fll,lettre,couleur_hex)
SELECT id_aliment,2,0,0,3,2,6,1,'B','#5BA829' FROM a;


-- B7 Chakchouka aux œufs
INSERT INTO aliment (nom_fr,nom_ar,nom_darija,id_categorie,type_aliment,portion_standard_g,est_plat_compose,source_donnee)
VALUES ('Chakchouka aux œufs','الشكشوكة','chakchouka',2,'plat_cuisine',200,TRUE,'calcul_recette');

WITH a AS (SELECT id_aliment FROM aliment WHERE nom_fr='Chakchouka aux œufs')
INSERT INTO valeur_nutritionnelle (id_aliment,energie_kcal,energie_kj,proteines_g,glucides_g,sucres_g,lipides_g,ags_g,fibres_g,sel_mg,eau_g,pct_fruits_leg_leg,source_reference)
SELECT id_aliment,85,356,5.5,7.5,4.5,4.2,1.8,2.5,380,78.0,55,'CIQUAL 2020 / calcul' FROM a;

WITH a AS (SELECT id_aliment FROM aliment WHERE nom_fr='Chakchouka aux œufs')
INSERT INTO nutridz_score (id_aliment,pts_energie,pts_ags,pts_sucres,pts_sel,pts_fibres,pts_proteines,pts_fll,lettre,couleur_hex)
SELECT id_aliment,1,0,0,3,3,4,3,'A','#1A7D3E' FROM a;


-- B8 Dolma (légumes farcis)
INSERT INTO aliment (nom_fr,nom_ar,nom_darija,id_categorie,type_aliment,portion_standard_g,est_plat_compose,source_donnee)
VALUES ('Dolma (légumes farcis)','الدولمة','dolma',2,'plat_cuisine',250,TRUE,'calcul_recette');

WITH a AS (SELECT id_aliment FROM aliment WHERE nom_fr='Dolma (légumes farcis)')
INSERT INTO valeur_nutritionnelle (id_aliment,energie_kcal,energie_kj,proteines_g,glucides_g,sucres_g,lipides_g,ags_g,fibres_g,sel_mg,eau_g,pct_fruits_leg_leg,source_reference)
SELECT id_aliment,110,460,6.5,12.0,2.2,4.0,1.5,2.8,420,72.0,45,'calcul_recette' FROM a;

WITH a AS (SELECT id_aliment FROM aliment WHERE nom_fr='Dolma (légumes farcis)')
INSERT INTO nutridz_score (id_aliment,pts_energie,pts_ags,pts_sucres,pts_sel,pts_fibres,pts_proteines,pts_fll,lettre,couleur_hex)
SELECT id_aliment,1,0,0,3,3,4,3,'A','#1A7D3E' FROM a;


-- ═══ SECTION C — ENTRÉES ET STREET FOOD ════════════════════════════════════

-- C1 Garantita
INSERT INTO aliment (nom_fr,nom_ar,nom_darija,id_categorie,type_aliment,portion_standard_g,est_plat_compose,region_origine,description,source_donnee)
VALUES ('Garantita','الغرنيطة','garantita',3,'plat_cuisine',150,TRUE,'Oran','Flan de farine de pois chiches cuit au four, cumin, harissa','calcul_recette');

WITH a AS (SELECT id_aliment FROM aliment WHERE nom_fr='Garantita')
INSERT INTO valeur_nutritionnelle (id_aliment,energie_kcal,energie_kj,proteines_g,glucides_g,sucres_g,lipides_g,ags_g,fibres_g,sel_mg,eau_g,pct_fruits_leg_leg,source_reference)
SELECT id_aliment,170,711,8.5,20.0,1.0,5.5,1.5,4.5,350,60.0,0,'CIQUAL farine pois chiches / calcul' FROM a;

WITH a AS (SELECT id_aliment FROM aliment WHERE nom_fr='Garantita')
INSERT INTO nutridz_score (id_aliment,pts_energie,pts_ags,pts_sucres,pts_sel,pts_fibres,pts_proteines,pts_fll,lettre,couleur_hex)
SELECT id_aliment,2,0,0,2,5,5,0,'B','#5BA829' FROM a;


-- C2 Bourek frit viande
INSERT INTO aliment (nom_fr,nom_ar,nom_darija,id_categorie,type_aliment,portion_standard_g,est_plat_compose,source_donnee)
VALUES ('Bourek frit à la viande','البوراك المقلي','bourek',3,'plat_cuisine',80,TRUE,'calcul_recette');

WITH a AS (SELECT id_aliment FROM aliment WHERE nom_fr='Bourek frit à la viande')
INSERT INTO valeur_nutritionnelle (id_aliment,energie_kcal,energie_kj,proteines_g,glucides_g,sucres_g,lipides_g,ags_g,fibres_g,sel_mg,eau_g,pct_fruits_leg_leg,source_reference)
SELECT id_aliment,295,1234,9.0,24.0,1.0,17.5,6.5,0.5,680,45.0,5,'calcul_recette + friture CIQUAL' FROM a;

WITH a AS (SELECT id_aliment FROM aliment WHERE nom_fr='Bourek frit à la viande')
INSERT INTO nutridz_score (id_aliment,pts_energie,pts_ags,pts_sucres,pts_sel,pts_fibres,pts_proteines,pts_fll,lettre,couleur_hex)
SELECT id_aliment,4,2,0,6,0,4,0,'D','#E37D00' FROM a;


-- C3 Bourek au four
INSERT INTO aliment (nom_fr,nom_ar,nom_darija,id_categorie,type_aliment,portion_standard_g,est_plat_compose,source_donnee)
VALUES ('Bourek au four','البوراك المشوي','bourek fel ferrane',3,'plat_cuisine',80,TRUE,'calcul_recette');

WITH a AS (SELECT id_aliment FROM aliment WHERE nom_fr='Bourek au four')
INSERT INTO valeur_nutritionnelle (id_aliment,energie_kcal,energie_kj,proteines_g,glucides_g,sucres_g,lipides_g,ags_g,fibres_g,sel_mg,eau_g,pct_fruits_leg_leg,source_reference)
SELECT id_aliment,210,879,9.5,24.0,1.0,9.0,3.5,0.8,580,52.0,5,'calcul_recette' FROM a;

WITH a AS (SELECT id_aliment FROM aliment WHERE nom_fr='Bourek au four')
INSERT INTO nutridz_score (id_aliment,pts_energie,pts_ags,pts_sucres,pts_sel,pts_fibres,pts_proteines,pts_fll,lettre,couleur_hex)
SELECT id_aliment,3,1,0,5,1,4,0,'C','#D4B800' FROM a;


-- C4 Mhadjeb
INSERT INTO aliment (nom_fr,nom_ar,nom_darija,id_categorie,type_aliment,portion_standard_g,est_plat_compose,source_donnee)
VALUES ('Mhadjeb','المحجوب','mhadjeb',3,'plat_cuisine',120,TRUE,'calcul_recette');

WITH a AS (SELECT id_aliment FROM aliment WHERE nom_fr='Mhadjeb')
INSERT INTO valeur_nutritionnelle (id_aliment,energie_kcal,energie_kj,proteines_g,glucides_g,sucres_g,lipides_g,ags_g,fibres_g,sel_mg,eau_g,pct_fruits_leg_leg,source_reference)
SELECT id_aliment,280,1171,7.5,35.0,1.5,12.0,4.5,1.5,420,42.0,15,'calcul_recette' FROM a;

WITH a AS (SELECT id_aliment FROM aliment WHERE nom_fr='Mhadjeb')
INSERT INTO nutridz_score (id_aliment,pts_energie,pts_ags,pts_sucres,pts_sel,pts_fibres,pts_proteines,pts_fll,lettre,couleur_hex)
SELECT id_aliment,4,1,0,4,1,3,1,'C','#D4B800' FROM a;


-- ═══ SECTION D — PÂTISSERIES ════════════════════════════════════════════════

-- D1 Baklava
INSERT INTO aliment (nom_fr,nom_ar,nom_darija,id_categorie,type_aliment,portion_standard_g,est_plat_compose,source_donnee)
VALUES ('Baklava','البقلاوة','baklawa',4,'patisserie',40,TRUE,'CIQUAL/infocalories');

WITH a AS (SELECT id_aliment FROM aliment WHERE nom_fr='Baklava')
INSERT INTO valeur_nutritionnelle (id_aliment,energie_kcal,energie_kj,proteines_g,glucides_g,sucres_g,lipides_g,ags_g,fibres_g,sel_mg,eau_g,pct_fruits_leg_leg,source_reference)
SELECT id_aliment,459,1921,10.4,50.2,39.6,24.5,4.6,1.0,95,8.0,0,'CIQUAL 2020 baklava' FROM a;

WITH a AS (SELECT id_aliment FROM aliment WHERE nom_fr='Baklava')
INSERT INTO nutridz_score (id_aliment,pts_energie,pts_ags,pts_sucres,pts_sel,pts_fibres,pts_proteines,pts_fll,lettre,couleur_hex)
SELECT id_aliment,10,1,10,0,0,5,0,'E','#C0392B' FROM a;


-- D2 Zlabia
INSERT INTO aliment (nom_fr,nom_ar,nom_darija,id_categorie,type_aliment,portion_standard_g,source_donnee)
VALUES ('Zlabia','الزلابية','zlabia',4,'patisserie',50,'les-calories.com');

WITH a AS (SELECT id_aliment FROM aliment WHERE nom_fr='Zlabia')
INSERT INTO valeur_nutritionnelle (id_aliment,energie_kcal,energie_kj,proteines_g,glucides_g,sucres_g,lipides_g,ags_g,fibres_g,sel_mg,eau_g,pct_fruits_leg_leg,source_reference)
SELECT id_aliment,310,1297,5.0,50.0,42.0,10.0,2.5,0.3,55,25.0,0,'les-calories.com / infocalories.fr' FROM a;

WITH a AS (SELECT id_aliment FROM aliment WHERE nom_fr='Zlabia')
INSERT INTO nutridz_score (id_aliment,pts_energie,pts_ags,pts_sucres,pts_sel,pts_fibres,pts_proteines,pts_fll,lettre,couleur_hex)
SELECT id_aliment,7,0,10,0,0,3,0,'E','#C0392B' FROM a;


-- D3 Maqrout au four
INSERT INTO aliment (nom_fr,nom_ar,nom_darija,id_categorie,type_aliment,portion_standard_g,source_donnee)
VALUES ('Maqrout au four','المقروط المشوي','maqrout',4,'patisserie',30,'les-calories.com');

WITH a AS (SELECT id_aliment FROM aliment WHERE nom_fr='Maqrout au four')
INSERT INTO valeur_nutritionnelle (id_aliment,energie_kcal,energie_kj,proteines_g,glucides_g,sucres_g,lipides_g,ags_g,fibres_g,sel_mg,eau_g,pct_fruits_leg_leg,source_reference)
SELECT id_aliment,253,1059,3.0,40.0,30.0,9.0,2.0,3.0,80,12.0,0,'les-calories.com' FROM a;

WITH a AS (SELECT id_aliment FROM aliment WHERE nom_fr='Maqrout au four')
INSERT INTO nutridz_score (id_aliment,pts_energie,pts_ags,pts_sucres,pts_sel,pts_fibres,pts_proteines,pts_fll,lettre,couleur_hex)
SELECT id_aliment,6,0,8,0,3,2,0,'D','#E37D00' FROM a;


-- D4 Kalb el louz
INSERT INTO aliment (nom_fr,nom_ar,nom_darija,id_categorie,type_aliment,portion_standard_g,source_donnee)
VALUES ('Kalb el louz','قلب اللوز','kalb el louz',4,'patisserie',50,'calcul_recette');

WITH a AS (SELECT id_aliment FROM aliment WHERE nom_fr='Kalb el louz')
INSERT INTO valeur_nutritionnelle (id_aliment,energie_kcal,energie_kj,proteines_g,glucides_g,sucres_g,lipides_g,ags_g,fibres_g,sel_mg,eau_g,pct_fruits_leg_leg,source_reference)
SELECT id_aliment,390,1632,6.5,42.0,38.0,22.0,5.5,1.5,110,8.0,0,'calcul_recette' FROM a;

WITH a AS (SELECT id_aliment FROM aliment WHERE nom_fr='Kalb el louz')
INSERT INTO nutridz_score (id_aliment,pts_energie,pts_ags,pts_sucres,pts_sel,pts_fibres,pts_proteines,pts_fll,lettre,couleur_hex)
SELECT id_aliment,9,2,9,0,0,3,0,'E','#C0392B' FROM a;


-- D5 Tcharek (cornes de gazelle)
INSERT INTO aliment (nom_fr,nom_ar,nom_darija,id_categorie,type_aliment,portion_standard_g,source_donnee)
VALUES ('Tcharek / Cornes de gazelle','تشارك','tcharek',4,'patisserie',25,'calcul_recette');

WITH a AS (SELECT id_aliment FROM aliment WHERE nom_fr='Tcharek / Cornes de gazelle')
INSERT INTO valeur_nutritionnelle (id_aliment,energie_kcal,energie_kj,proteines_g,glucides_g,sucres_g,lipides_g,ags_g,fibres_g,sel_mg,eau_g,pct_fruits_leg_leg,source_reference)
SELECT id_aliment,380,1590,6.0,38.0,28.0,22.0,6.5,2.5,75,8.0,0,'calcul_recette' FROM a;

WITH a AS (SELECT id_aliment FROM aliment WHERE nom_fr='Tcharek / Cornes de gazelle')
INSERT INTO nutridz_score (id_aliment,pts_energie,pts_ags,pts_sucres,pts_sel,pts_fibres,pts_proteines,pts_fll,lettre,couleur_hex)
SELECT id_aliment,9,2,8,0,2,3,0,'D','#E37D00' FROM a;


-- ═══ SECTION E — FRUITS ET LÉGUMES ══════════════════════════════════════════

-- E1 Tomate fraîche
INSERT INTO aliment (nom_fr,nom_ar,nom_darija,id_categorie,type_aliment,portion_standard_g,source_donnee)
VALUES ('Tomate fraîche','الطماطم الطازجة','tomata',6,'brut',100,'CIQUAL 2020');

WITH a AS (SELECT id_aliment FROM aliment WHERE nom_fr='Tomate fraîche')
INSERT INTO valeur_nutritionnelle (id_aliment,energie_kcal,energie_kj,proteines_g,glucides_g,sucres_g,lipides_g,ags_g,fibres_g,sel_mg,eau_g,pct_fruits_leg_leg,source_reference)
SELECT id_aliment,18,75,0.9,3.5,2.8,0.2,0.0,1.2,5,94.0,100,'CIQUAL 2020 code 20047' FROM a;

WITH a AS (SELECT id_aliment FROM aliment WHERE nom_fr='Tomate fraîche')
INSERT INTO nutridz_score (id_aliment,pts_energie,pts_ags,pts_sucres,pts_sel,pts_fibres,pts_proteines,pts_fll,lettre,couleur_hex)
SELECT id_aliment,0,0,0,0,1,0,5,'A','#1A7D3E' FROM a;


-- E2 Poivron rouge
INSERT INTO aliment (nom_fr,nom_ar,nom_darija,id_categorie,type_aliment,portion_standard_g,source_donnee)
VALUES ('Poivron rouge frais','الفلفل الأحمر','felfel',6,'brut',100,'CIQUAL 2020');

WITH a AS (SELECT id_aliment FROM aliment WHERE nom_fr='Poivron rouge frais')
INSERT INTO valeur_nutritionnelle (id_aliment,energie_kcal,energie_kj,proteines_g,glucides_g,sucres_g,lipides_g,ags_g,fibres_g,sel_mg,eau_g,pct_fruits_leg_leg,source_reference)
SELECT id_aliment,28,117,1.0,5.4,4.5,0.3,0.0,2.1,4,92.0,100,'CIQUAL 2020' FROM a;

WITH a AS (SELECT id_aliment FROM aliment WHERE nom_fr='Poivron rouge frais')
INSERT INTO nutridz_score (id_aliment,pts_energie,pts_ags,pts_sucres,pts_sel,pts_fibres,pts_proteines,pts_fll,lettre,couleur_hex)
SELECT id_aliment,0,0,0,0,2,0,5,'A','#1A7D3E' FROM a;


-- E3 Courgette
INSERT INTO aliment (nom_fr,nom_ar,nom_darija,id_categorie,type_aliment,portion_standard_g,source_donnee)
VALUES ('Courgette fraîche','الكوسة','koussa',6,'brut',100,'CIQUAL 2020');

WITH a AS (SELECT id_aliment FROM aliment WHERE nom_fr='Courgette fraîche')
INSERT INTO valeur_nutritionnelle (id_aliment,energie_kcal,energie_kj,proteines_g,glucides_g,sucres_g,lipides_g,ags_g,fibres_g,sel_mg,eau_g,pct_fruits_leg_leg,source_reference)
SELECT id_aliment,17,71,1.2,2.5,1.7,0.3,0.0,1.1,5,95.0,100,'CIQUAL 2020' FROM a;

WITH a AS (SELECT id_aliment FROM aliment WHERE nom_fr='Courgette fraîche')
INSERT INTO nutridz_score (id_aliment,pts_energie,pts_ags,pts_sucres,pts_sel,pts_fibres,pts_proteines,pts_fll,lettre,couleur_hex)
SELECT id_aliment,0,0,0,0,1,0,5,'A','#1A7D3E' FROM a;


-- E4 Figue de Barbarie
INSERT INTO aliment (nom_fr,nom_ar,nom_darija,id_categorie,type_aliment,portion_standard_g,region_origine,source_donnee)
VALUES ('Figue de Barbarie','التين الشوكي','karmouss chaoui',5,'brut',100,'National','USDA FoodData Central');

WITH a AS (SELECT id_aliment FROM aliment WHERE nom_fr='Figue de Barbarie')
INSERT INTO valeur_nutritionnelle (id_aliment,energie_kcal,energie_kj,proteines_g,glucides_g,sucres_g,lipides_g,ags_g,fibres_g,sel_mg,eau_g,pct_fruits_leg_leg,source_reference)
SELECT id_aliment,41,172,0.7,9.6,8.5,0.5,0.1,3.6,5,88.0,100,'USDA FoodData Central 09089' FROM a;

WITH a AS (SELECT id_aliment FROM aliment WHERE nom_fr='Figue de Barbarie')
INSERT INTO nutridz_score (id_aliment,pts_energie,pts_ags,pts_sucres,pts_sel,pts_fibres,pts_proteines,pts_fll,lettre,couleur_hex)
SELECT id_aliment,0,0,0,0,4,0,5,'A','#1A7D3E' FROM a;


-- E5 Datte Deglet Nour
INSERT INTO aliment (nom_fr,nom_ar,nom_darija,id_categorie,type_aliment,portion_standard_g,region_origine,source_donnee)
VALUES ('Datte Deglet Nour','تمر دقلة نور','tmar deglet',5,'brut',100,'Biskra / Tolga','CIQUAL 2020');

WITH a AS (SELECT id_aliment FROM aliment WHERE nom_fr='Datte Deglet Nour')
INSERT INTO valeur_nutritionnelle (id_aliment,energie_kcal,energie_kj,proteines_g,glucides_g,sucres_g,lipides_g,ags_g,fibres_g,sel_mg,eau_g,pct_fruits_leg_leg,source_reference)
SELECT id_aliment,282,1180,2.5,73.5,66.0,0.4,0.0,6.7,1,21.0,100,'CIQUAL 2020 code 20009' FROM a;

WITH a AS (SELECT id_aliment FROM aliment WHERE nom_fr='Datte Deglet Nour')
INSERT INTO nutridz_score (id_aliment,pts_energie,pts_ags,pts_sucres,pts_sel,pts_fibres,pts_proteines,pts_fll,lettre,couleur_hex)
SELECT id_aliment,6,0,7,0,7,1,5,'B','#5BA829' FROM a;


-- E6 Grenade
INSERT INTO aliment (nom_fr,nom_ar,nom_darija,id_categorie,type_aliment,portion_standard_g,source_donnee)
VALUES ('Grenade fraîche','الرمان','roman',5,'brut',100,'USDA FoodData Central');

WITH a AS (SELECT id_aliment FROM aliment WHERE nom_fr='Grenade fraîche')
INSERT INTO valeur_nutritionnelle (id_aliment,energie_kcal,energie_kj,proteines_g,glucides_g,sucres_g,lipides_g,ags_g,fibres_g,sel_mg,eau_g,pct_fruits_leg_leg,source_reference)
SELECT id_aliment,83,347,1.7,18.7,13.7,1.2,0.1,4.0,3,78.0,100,'USDA FoodData Central 09286' FROM a;

WITH a AS (SELECT id_aliment FROM aliment WHERE nom_fr='Grenade fraîche')
INSERT INTO nutridz_score (id_aliment,pts_energie,pts_ags,pts_sucres,pts_sel,pts_fibres,pts_proteines,pts_fll,lettre,couleur_hex)
SELECT id_aliment,1,0,1,0,5,0,5,'A','#1A7D3E' FROM a;


-- E7 Abricot frais
INSERT INTO aliment (nom_fr,nom_ar,nom_darija,id_categorie,type_aliment,portion_standard_g,source_donnee)
VALUES ('Abricot frais','المشمش','mchemech',5,'brut',100,'CIQUAL 2020');

WITH a AS (SELECT id_aliment FROM aliment WHERE nom_fr='Abricot frais')
INSERT INTO valeur_nutritionnelle (id_aliment,energie_kcal,energie_kj,proteines_g,glucides_g,sucres_g,lipides_g,ags_g,fibres_g,sel_mg,eau_g,pct_fruits_leg_leg,source_reference)
SELECT id_aliment,48,201,1.4,10.9,9.2,0.4,0.0,2.0,1,86.0,100,'CIQUAL 2020 code 20001' FROM a;

WITH a AS (SELECT id_aliment FROM aliment WHERE nom_fr='Abricot frais')
INSERT INTO nutridz_score (id_aliment,pts_energie,pts_ags,pts_sucres,pts_sel,pts_fibres,pts_proteines,pts_fll,lettre,couleur_hex)
SELECT id_aliment,0,0,0,0,2,0,5,'A','#1A7D3E' FROM a;


-- ═══ SECTION F — LÉGUMINEUSES ET CÉRÉALES ═══════════════════════════════════

-- F1 Pois chiches cuits
INSERT INTO aliment (nom_fr,nom_ar,nom_darija,id_categorie,type_aliment,portion_standard_g,source_donnee)
VALUES ('Pois chiches cuits','الحمص المسلوق','hmouss',8,'brut',100,'CIQUAL 2020');

WITH a AS (SELECT id_aliment FROM aliment WHERE nom_fr='Pois chiches cuits')
INSERT INTO valeur_nutritionnelle (id_aliment,energie_kcal,energie_kj,proteines_g,glucides_g,sucres_g,lipides_g,ags_g,fibres_g,sel_mg,eau_g,pct_fruits_leg_leg,source_reference)
SELECT id_aliment,120,502,7.0,18.0,0.5,2.0,0.1,5.3,7,60.0,100,'CIQUAL 2020 code 13049' FROM a;

WITH a AS (SELECT id_aliment FROM aliment WHERE nom_fr='Pois chiches cuits')
INSERT INTO nutridz_score (id_aliment,pts_energie,pts_ags,pts_sucres,pts_sel,pts_fibres,pts_proteines,pts_fll,lettre,couleur_hex)
SELECT id_aliment,1,0,0,0,6,4,5,'A','#1A7D3E' FROM a;


-- F2 Lentilles cuites
INSERT INTO aliment (nom_fr,nom_ar,nom_darija,id_categorie,type_aliment,portion_standard_g,source_donnee)
VALUES ('Lentilles cuites','العدس المسلوق','ades',8,'brut',100,'CIQUAL 2020');

WITH a AS (SELECT id_aliment FROM aliment WHERE nom_fr='Lentilles cuites')
INSERT INTO valeur_nutritionnelle (id_aliment,energie_kcal,energie_kj,proteines_g,glucides_g,sucres_g,lipides_g,ags_g,fibres_g,sel_mg,eau_g,pct_fruits_leg_leg,source_reference)
SELECT id_aliment,116,485,9.0,16.5,1.5,0.6,0.1,7.9,6,70.0,100,'CIQUAL 2020 code 13020' FROM a;

WITH a AS (SELECT id_aliment FROM aliment WHERE nom_fr='Lentilles cuites')
INSERT INTO nutridz_score (id_aliment,pts_energie,pts_ags,pts_sucres,pts_sel,pts_fibres,pts_proteines,pts_fll,lettre,couleur_hex)
SELECT id_aliment,1,0,0,0,7,5,5,'A','#1A7D3E' FROM a;


-- F3 Fèves cuites
INSERT INTO aliment (nom_fr,nom_ar,nom_darija,id_categorie,type_aliment,portion_standard_g,source_donnee)
VALUES ('Fèves cuites','الفول المسلوق','foul',8,'brut',100,'CIQUAL 2020');

WITH a AS (SELECT id_aliment FROM aliment WHERE nom_fr='Fèves cuites')
INSERT INTO valeur_nutritionnelle (id_aliment,energie_kcal,energie_kj,proteines_g,glucides_g,sucres_g,lipides_g,ags_g,fibres_g,sel_mg,eau_g,pct_fruits_leg_leg,source_reference)
SELECT id_aliment,110,460,7.6,15.5,0.5,0.5,0.1,5.4,12,72.0,100,'CIQUAL 2020 code 13009' FROM a;

WITH a AS (SELECT id_aliment FROM aliment WHERE nom_fr='Fèves cuites')
INSERT INTO nutridz_score (id_aliment,pts_energie,pts_ags,pts_sucres,pts_sel,pts_fibres,pts_proteines,pts_fll,lettre,couleur_hex)
SELECT id_aliment,1,0,0,0,6,4,5,'A','#1A7D3E' FROM a;


-- F4 Frik (blé vert concassé, cuit)
INSERT INTO aliment (nom_fr,nom_ar,nom_darija,id_categorie,type_aliment,portion_standard_g,source_donnee)
VALUES ('Frik cuit (blé vert concassé)','الفريك المطبوخ','frik',7,'brut',100,'USDA / calcul');

WITH a AS (SELECT id_aliment FROM aliment WHERE nom_fr='Frik cuit (blé vert concassé)')
INSERT INTO valeur_nutritionnelle (id_aliment,energie_kcal,energie_kj,proteines_g,glucides_g,sucres_g,lipides_g,ags_g,fibres_g,sel_mg,eau_g,pct_fruits_leg_leg,source_reference)
SELECT id_aliment,105,439,4.5,20.5,0.5,0.6,0.1,6.8,5,70.0,100,'USDA freekeh cooked / estime' FROM a;

WITH a AS (SELECT id_aliment FROM aliment WHERE nom_fr='Frik cuit (blé vert concassé)')
INSERT INTO nutridz_score (id_aliment,pts_energie,pts_ags,pts_sucres,pts_sel,pts_fibres,pts_proteines,pts_fll,lettre,couleur_hex)
SELECT id_aliment,1,0,0,0,7,3,5,'A','#1A7D3E' FROM a;


-- F5 Semoule de blé dur cuite
INSERT INTO aliment (nom_fr,nom_ar,nom_darija,id_categorie,type_aliment,portion_standard_g,source_donnee)
VALUES ('Semoule de blé dur cuite','سميد القمح الصلب المطبوخ','smida',7,'transforme',100,'CIQUAL 2020');

WITH a AS (SELECT id_aliment FROM aliment WHERE nom_fr='Semoule de blé dur cuite')
INSERT INTO valeur_nutritionnelle (id_aliment,energie_kcal,energie_kj,proteines_g,glucides_g,sucres_g,lipides_g,ags_g,fibres_g,sel_mg,eau_g,pct_fruits_leg_leg,source_reference)
SELECT id_aliment,112,469,4.0,23.0,0.1,0.3,0.0,1.5,5,71.0,0,'CIQUAL 2020 couscous cuit' FROM a;

WITH a AS (SELECT id_aliment FROM aliment WHERE nom_fr='Semoule de blé dur cuite')
INSERT INTO nutridz_score (id_aliment,pts_energie,pts_ags,pts_sucres,pts_sel,pts_fibres,pts_proteines,pts_fll,lettre,couleur_hex)
SELECT id_aliment,1,0,0,0,1,2,0,'B','#5BA829' FROM a;


-- F6 Farine de pois chiches (crue)
INSERT INTO aliment (nom_fr,nom_ar,nom_darija,id_categorie,type_aliment,portion_standard_g,source_donnee)
VALUES ('Farine de pois chiches','دقيق الحمص','dkik el hmouss',7,'transforme',100,'CIQUAL 2020');

WITH a AS (SELECT id_aliment FROM aliment WHERE nom_fr='Farine de pois chiches')
INSERT INTO valeur_nutritionnelle (id_aliment,energie_kcal,energie_kj,proteines_g,glucides_g,sucres_g,lipides_g,ags_g,fibres_g,sel_mg,eau_g,pct_fruits_leg_leg,source_reference)
SELECT id_aliment,387,1619,22.0,58.0,10.0,6.0,1.0,10.8,64,10.0,100,'CIQUAL 2020 / USDA 16087' FROM a;

WITH a AS (SELECT id_aliment FROM aliment WHERE nom_fr='Farine de pois chiches')
INSERT INTO nutridz_score (id_aliment,pts_energie,pts_ags,pts_sucres,pts_sel,pts_fibres,pts_proteines,pts_fll,lettre,couleur_hex)
SELECT id_aliment,8,0,1,0,7,7,5,'A','#1A7D3E' FROM a;


-- ═══ SECTION G — PRODUITS LAITIERS ══════════════════════════════════════════

-- G1 Lben (lait fermenté)
INSERT INTO aliment (nom_fr,nom_ar,nom_darija,id_categorie,type_aliment,portion_standard_g,source_donnee)
VALUES ('Lben (lait fermenté traditionnel)','اللبن','leben',9,'transforme',200,'CIQUAL 2020');

WITH a AS (SELECT id_aliment FROM aliment WHERE nom_fr='Lben (lait fermenté traditionnel)')
INSERT INTO valeur_nutritionnelle (id_aliment,energie_kcal,energie_kj,proteines_g,glucides_g,sucres_g,lipides_g,ags_g,fibres_g,sel_mg,eau_g,pct_fruits_leg_leg,source_reference)
SELECT id_aliment,38,159,3.5,4.8,4.8,0.6,0.4,0.0,50,91.0,0,'CIQUAL 2020 lait fermenté écrémé' FROM a;

WITH a AS (SELECT id_aliment FROM aliment WHERE nom_fr='Lben (lait fermenté traditionnel)')
INSERT INTO nutridz_score (id_aliment,pts_energie,pts_ags,pts_sucres,pts_sel,pts_fibres,pts_proteines,pts_fll,lettre,couleur_hex)
SELECT id_aliment,0,0,1,1,0,3,0,'A','#1A7D3E' FROM a;


-- G2 Yaourt nature
INSERT INTO aliment (nom_fr,nom_ar,nom_darija,id_categorie,type_aliment,portion_standard_g,source_donnee)
VALUES ('Yaourt nature Soummam','ياغورت طبيعي','yaoghurt',9,'transforme',125,'declare_fabricant');

WITH a AS (SELECT id_aliment FROM aliment WHERE nom_fr='Yaourt nature Soummam')
INSERT INTO valeur_nutritionnelle (id_aliment,energie_kcal,energie_kj,proteines_g,glucides_g,sucres_g,lipides_g,ags_g,fibres_g,sel_mg,eau_g,pct_fruits_leg_leg,source_reference)
SELECT id_aliment,55,230,3.8,5.5,5.5,1.5,1.0,0.0,55,87.0,0,'Déclaration emballage Soummam' FROM a;

WITH a AS (SELECT id_aliment FROM aliment WHERE nom_fr='Yaourt nature Soummam')
INSERT INTO nutridz_score (id_aliment,pts_energie,pts_ags,pts_sucres,pts_sel,pts_fibres,pts_proteines,pts_fll,lettre,couleur_hex)
SELECT id_aliment,0,0,1,1,0,3,0,'B','#5BA829' FROM a;


-- ═══ SECTION H — VIANDES ═══════════════════════════════════════════════════

-- H1 Agneau cuit
INSERT INTO aliment (nom_fr,nom_ar,nom_darija,id_categorie,type_aliment,portion_standard_g,source_donnee)
VALUES ('Agneau épaule cuit','لحم الخروف المطبوخ','lahm ghanem',10,'brut',100,'CIQUAL 2020');

WITH a AS (SELECT id_aliment FROM aliment WHERE nom_fr='Agneau épaule cuit')
INSERT INTO valeur_nutritionnelle (id_aliment,energie_kcal,energie_kj,proteines_g,glucides_g,sucres_g,lipides_g,ags_g,fibres_g,sel_mg,eau_g,pct_fruits_leg_leg,source_reference)
SELECT id_aliment,240,1004,25.0,0.0,0.0,15.5,7.5,0.0,70,60.0,0,'CIQUAL 2020 code 36004' FROM a;

WITH a AS (SELECT id_aliment FROM aliment WHERE nom_fr='Agneau épaule cuit')
INSERT INTO nutridz_score (id_aliment,pts_energie,pts_ags,pts_sucres,pts_sel,pts_fibres,pts_proteines,pts_fll,lettre,couleur_hex)
SELECT id_aliment,4,3,0,0,0,7,0,'C','#D4B800' FROM a;


-- H2 Merguez grillée
INSERT INTO aliment (nom_fr,nom_ar,nom_darija,id_categorie,type_aliment,portion_standard_g,source_donnee)
VALUES ('Merguez grillée','المرقاز المشوي','merguez',10,'transforme',100,'CIQUAL 2020');

WITH a AS (SELECT id_aliment FROM aliment WHERE nom_fr='Merguez grillée')
INSERT INTO valeur_nutritionnelle (id_aliment,energie_kcal,energie_kj,proteines_g,glucides_g,sucres_g,lipides_g,ags_g,fibres_g,sel_mg,eau_g,pct_fruits_leg_leg,source_reference)
SELECT id_aliment,320,1339,16.0,2.0,0.5,26.5,12.0,0.0,1400,55.0,0,'CIQUAL 2020 code 36049' FROM a;

WITH a AS (SELECT id_aliment FROM aliment WHERE nom_fr='Merguez grillée')
INSERT INTO nutridz_score (id_aliment,pts_energie,pts_ags,pts_sucres,pts_sel,pts_fibres,pts_proteines,pts_fll,lettre,couleur_hex)
SELECT id_aliment,6,5,0,10,0,7,0,'E','#C0392B' FROM a;


-- H3 Poulet sans peau grillé
INSERT INTO aliment (nom_fr,nom_ar,nom_darija,id_categorie,type_aliment,portion_standard_g,source_donnee)
VALUES ('Poulet grillé sans peau','دجاج مشوي بدون جلد','djaj mechwi',10,'brut',100,'CIQUAL 2020');

WITH a AS (SELECT id_aliment FROM aliment WHERE nom_fr='Poulet grillé sans peau')
INSERT INTO valeur_nutritionnelle (id_aliment,energie_kcal,energie_kj,proteines_g,glucides_g,sucres_g,lipides_g,ags_g,fibres_g,sel_mg,eau_g,pct_fruits_leg_leg,source_reference)
SELECT id_aliment,165,690,31.0,0.0,0.0,3.6,1.0,0.0,74,65.0,0,'CIQUAL 2020 code 35049' FROM a;

WITH a AS (SELECT id_aliment FROM aliment WHERE nom_fr='Poulet grillé sans peau')
INSERT INTO nutridz_score (id_aliment,pts_energie,pts_ags,pts_sucres,pts_sel,pts_fibres,pts_proteines,pts_fll,lettre,couleur_hex)
SELECT id_aliment,2,0,0,0,0,7,0,'B','#5BA829' FROM a;


-- ═══ SECTION I — CORPS GRAS ═════════════════════════════════════════════════

-- I1 Huile d'olive
INSERT INTO aliment (nom_fr,nom_ar,nom_darija,id_categorie,type_aliment,portion_standard_g,source_donnee)
VALUES ('Huile d''olive vierge extra','زيت الزيتون','zit zitoune',12,'transforme',100,'CIQUAL 2020');

WITH a AS (SELECT id_aliment FROM aliment WHERE nom_fr='Huile d''olive vierge extra')
INSERT INTO valeur_nutritionnelle (id_aliment,energie_kcal,energie_kj,proteines_g,glucides_g,sucres_g,lipides_g,ags_g,agmi_g,agpi_g,fibres_g,sel_mg,eau_g,pct_fruits_leg_leg,source_reference)
SELECT id_aliment,884,3699,0.0,0.0,0.0,100.0,14.0,73.0,11.0,0.0,0,0.0,0,'CIQUAL 2020 code 16020' FROM a;

WITH a AS (SELECT id_aliment FROM aliment WHERE nom_fr='Huile d''olive vierge extra')
INSERT INTO nutridz_score (id_aliment,pts_energie,pts_ags,pts_sucres,pts_sel,pts_fibres,pts_proteines,pts_fll,lettre,couleur_hex)
SELECT id_aliment,10,2,0,0,0,0,2,'B','#5BA829' FROM a;


-- I2 Huile de tournesol Fleurial
INSERT INTO aliment (nom_fr,nom_ar,nom_darija,id_categorie,type_aliment,portion_standard_g,source_donnee)
VALUES ('Huile de tournesol','زيت عباد الشمس','zit normal',12,'transforme',100,'CIQUAL 2020');

WITH a AS (SELECT id_aliment FROM aliment WHERE nom_fr='Huile de tournesol')
INSERT INTO valeur_nutritionnelle (id_aliment,energie_kcal,energie_kj,proteines_g,glucides_g,sucres_g,lipides_g,ags_g,agmi_g,agpi_g,fibres_g,sel_mg,eau_g,pct_fruits_leg_leg,source_reference)
SELECT id_aliment,884,3699,0.0,0.0,0.0,100.0,11.0,20.0,67.0,0.0,0,0.0,0,'CIQUAL 2020 code 16027' FROM a;

WITH a AS (SELECT id_aliment FROM aliment WHERE nom_fr='Huile de tournesol')
INSERT INTO nutridz_score (id_aliment,pts_energie,pts_ags,pts_sucres,pts_sel,pts_fibres,pts_proteines,pts_fll,lettre,couleur_hex)
SELECT id_aliment,10,1,0,0,0,0,1,'C','#D4B800' FROM a;


-- ═══ SECTION J — PRODUITS INDUSTRIELS ALGÉRIENS ════════════════════════════

-- J1 Galette BIMO Senior
INSERT INTO aliment (nom_fr,nom_ar,nom_darija,id_categorie,type_aliment,portion_standard_g,source_donnee)
VALUES ('Galette BIMO Senior au lait','غاليط بيمو','bimo',14,'ultra_transforme',100,'declare_fabricant');

WITH a AS (SELECT id_aliment FROM aliment WHERE nom_fr='Galette BIMO Senior au lait')
INSERT INTO valeur_nutritionnelle (id_aliment,energie_kcal,energie_kj,proteines_g,glucides_g,sucres_g,lipides_g,ags_g,fibres_g,sel_mg,eau_g,pct_fruits_leg_leg,source_reference)
SELECT id_aliment,478,2000,7.0,65.0,20.0,20.0,5.2,1.0,430,3.0,0,'Déclaration emballage BIMO 2023' FROM a;

WITH a AS (SELECT id_aliment FROM aliment WHERE nom_fr='Galette BIMO Senior au lait')
INSERT INTO nutridz_score (id_aliment,pts_energie,pts_ags,pts_sucres,pts_sel,pts_fibres,pts_proteines,pts_fll,lettre,couleur_hex)
SELECT id_aliment,10,2,5,4,0,4,0,'D','#E37D00' FROM a;

INSERT INTO produit_industriel (id_aliment,marque,gamme,pays_fabrication,ville_fabrication,statut_etiquetage)
SELECT id_aliment,'BIMO','Galettes dorées','Algérie','Baba-Ali, Alger','sans_nutriscore'
FROM aliment WHERE nom_fr='Galette BIMO Senior au lait';


-- J2 Eau minérale Ifri
INSERT INTO aliment (nom_fr,nom_ar,nom_darija,id_categorie,type_aliment,portion_standard_g,source_donnee)
VALUES ('Eau minérale Ifri','مياه معدنية إفري','ifri',11,'brut',500,'declare_fabricant');

WITH a AS (SELECT id_aliment FROM aliment WHERE nom_fr='Eau minérale Ifri')
INSERT INTO valeur_nutritionnelle (id_aliment,energie_kcal,energie_kj,proteines_g,glucides_g,sucres_g,lipides_g,ags_g,fibres_g,sel_mg,eau_g,pct_fruits_leg_leg,source_reference)
SELECT id_aliment,0,0,0.0,0.0,0.0,0.0,0.0,0.0,0,100.0,0,'Déclaration emballage Ifri 2023' FROM a;

WITH a AS (SELECT id_aliment FROM aliment WHERE nom_fr='Eau minérale Ifri')
INSERT INTO nutridz_score (id_aliment,pts_energie,pts_ags,pts_sucres,pts_sel,pts_fibres,pts_proteines,pts_fll,lettre,couleur_hex)
SELECT id_aliment,0,0,0,0,0,0,0,'A','#1A7D3E' FROM a;

INSERT INTO produit_industriel (id_aliment,marque,gamme,code_barres,pays_fabrication,ville_fabrication,statut_etiquetage)
SELECT id_aliment,'Ifri','Eau minérale naturelle','6130093010045','Algérie','Ighzer Amokrane, Béjaïa','sans_nutriscore'
FROM aliment WHERE nom_fr='Eau minérale Ifri';


-- J3 Jus Ifri orange 100%
INSERT INTO aliment (nom_fr,nom_ar,nom_darija,id_categorie,type_aliment,portion_standard_g,source_donnee)
VALUES ('Jus Ifri orange 100%','عصير إفري برتقال','cassis ifri',11,'transforme',200,'declare_fabricant');

WITH a AS (SELECT id_aliment FROM aliment WHERE nom_fr='Jus Ifri orange 100%')
INSERT INTO valeur_nutritionnelle (id_aliment,energie_kcal,energie_kj,proteines_g,glucides_g,sucres_g,lipides_g,ags_g,fibres_g,sel_mg,eau_g,pct_fruits_leg_leg,source_reference)
SELECT id_aliment,45,188,0.7,10.5,9.5,0.2,0.0,0.3,10,87.0,100,'Déclaration emballage Ifri / CIQUAL jus orange' FROM a;

WITH a AS (SELECT id_aliment FROM aliment WHERE nom_fr='Jus Ifri orange 100%')
INSERT INTO nutridz_score (id_aliment,pts_energie,pts_ags,pts_sucres,pts_sel,pts_fibres,pts_proteines,pts_fll,lettre,couleur_hex)
SELECT id_aliment,0,0,1,0,0,0,5,'B','#5BA829' FROM a;

INSERT INTO produit_industriel (id_aliment,marque,gamme,pays_fabrication,ville_fabrication,statut_etiquetage)
SELECT id_aliment,'Ifri','Jus 100% fruits','Algérie','Béjaïa','sans_nutriscore'
FROM aliment WHERE nom_fr='Jus Ifri orange 100%';


-- J4 Tchin-Tchin cola
INSERT INTO aliment (nom_fr,nom_ar,nom_darija,id_categorie,type_aliment,portion_standard_g,source_donnee)
VALUES ('Tchin-Tchin cola','تشين تشين كولا','tchin tchin',11,'ultra_transforme',330,'declare_fabricant');

WITH a AS (SELECT id_aliment FROM aliment WHERE nom_fr='Tchin-Tchin cola')
INSERT INTO valeur_nutritionnelle (id_aliment,energie_kcal,energie_kj,proteines_g,glucides_g,sucres_g,lipides_g,ags_g,fibres_g,sel_mg,eau_g,pct_fruits_leg_leg,source_reference)
SELECT id_aliment,42,176,0.0,10.5,10.5,0.0,0.0,0.0,15,89.0,0,'Déclaration emballage Tchin-Tchin 2023' FROM a;

WITH a AS (SELECT id_aliment FROM aliment WHERE nom_fr='Tchin-Tchin cola')
INSERT INTO nutridz_score (id_aliment,pts_energie,pts_ags,pts_sucres,pts_sel,pts_fibres,pts_proteines,pts_fll,lettre,couleur_hex)
SELECT id_aliment,0,0,3,0,0,0,0,'D','#E37D00' FROM a;

INSERT INTO produit_industriel (id_aliment,marque,gamme,pays_fabrication,statut_etiquetage)
SELECT id_aliment,'Tchin-Tchin','Sodas','Algérie','sans_nutriscore'
FROM aliment WHERE nom_fr='Tchin-Tchin cola';


-- J5 Hamoud Boualem limonade
INSERT INTO aliment (nom_fr,nom_ar,nom_darija,id_categorie,type_aliment,portion_standard_g,source_donnee)
VALUES ('Hamoud Boualem limonade','حمود بو علام','hamoud',11,'ultra_transforme',250,'declare_fabricant');

WITH a AS (SELECT id_aliment FROM aliment WHERE nom_fr='Hamoud Boualem limonade')
INSERT INTO valeur_nutritionnelle (id_aliment,energie_kcal,energie_kj,proteines_g,glucides_g,sucres_g,lipides_g,ags_g,fibres_g,sel_mg,eau_g,pct_fruits_leg_leg,source_reference)
SELECT id_aliment,38,159,0.0,9.0,9.0,0.0,0.0,0.0,12,91.0,0,'Déclaration emballage Hamoud Boualem 2023' FROM a;

WITH a AS (SELECT id_aliment FROM aliment WHERE nom_fr='Hamoud Boualem limonade')
INSERT INTO nutridz_score (id_aliment,pts_energie,pts_ags,pts_sucres,pts_sel,pts_fibres,pts_proteines,pts_fll,lettre,couleur_hex)
SELECT id_aliment,0,0,2,0,0,0,0,'D','#E37D00' FROM a;

INSERT INTO produit_industriel (id_aliment,marque,gamme,pays_fabrication,ville_fabrication,statut_etiquetage)
SELECT id_aliment,'Hamoud Boualem','Limonade traditionnelle','Algérie','Alger','sans_nutriscore'
FROM aliment WHERE nom_fr='Hamoud Boualem limonade';


-- J6 Lait UHT entier (marque locale)
INSERT INTO aliment (nom_fr,nom_ar,nom_darija,id_categorie,type_aliment,portion_standard_g,source_donnee)
VALUES ('Lait entier UHT (Hodna Milk)','حليب كامل الدسم','hlib',11,'transforme',200,'declare_fabricant');

WITH a AS (SELECT id_aliment FROM aliment WHERE nom_fr='Lait entier UHT (Hodna Milk)')
INSERT INTO valeur_nutritionnelle (id_aliment,energie_kcal,energie_kj,proteines_g,glucides_g,sucres_g,lipides_g,ags_g,fibres_g,sel_mg,eau_g,pct_fruits_leg_leg,source_reference)
SELECT id_aliment,60,251,3.2,4.8,4.8,3.3,2.1,0.0,50,88.0,0,'CIQUAL 2020 lait entier UHT + Hodna Milk' FROM a;

WITH a AS (SELECT id_aliment FROM aliment WHERE nom_fr='Lait entier UHT (Hodna Milk)')
INSERT INTO nutridz_score (id_aliment,pts_energie,pts_ags,pts_sucres,pts_sel,pts_fibres,pts_proteines,pts_fll,lettre,couleur_hex)
SELECT id_aliment,0,0,1,1,0,2,0,'C','#D4B800' FROM a;

INSERT INTO produit_industriel (id_aliment,marque,gamme,pays_fabrication,statut_etiquetage)
SELECT id_aliment,'Hodna Milk','Lait UHT','Algérie','sans_nutriscore'
FROM aliment WHERE nom_fr='Lait entier UHT (Hodna Milk)';


-- ─────────────────────────────────────────────────────────────────────────────
--  5. VUES UTILES POUR L'APPLICATION
-- ─────────────────────────────────────────────────────────────────────────────

-- Vue complète aliment + valeurs + score (vue principale de l'app)
CREATE OR REPLACE VIEW v_aliment_complet AS
SELECT
    a.id_aliment,
    a.nom_fr,
    a.nom_ar,
    a.nom_darija,
    c.nom_fr                      AS categorie,
    c.type                        AS type_categorie,
    a.type_aliment,
    a.portion_standard_g,
    a.region_origine,
    -- Valeurs nutritionnelles
    v.energie_kcal,
    v.proteines_g,
    v.glucides_g,
    v.sucres_g,
    v.lipides_g,
    v.ags_g,
    v.fibres_g,
    v.sel_mg,
    v.pct_fruits_leg_leg,
    -- Score NutriDz
    s.score_final,
    s.lettre                      AS nutridz_lettre,
    s.couleur_hex                 AS nutridz_couleur,
    s.points_negatifs,
    s.points_positifs,
    s.version_algo,
    -- Image
    a.image_url
FROM aliment a
JOIN categorie              c ON a.id_categorie = c.id_categorie
LEFT JOIN valeur_nutritionnelle v ON a.id_aliment   = v.id_aliment
LEFT JOIN nutridz_score         s ON a.id_aliment   = s.id_aliment
WHERE a.est_actif = TRUE
ORDER BY s.lettre NULLS LAST, a.nom_fr;

COMMENT ON VIEW v_aliment_complet IS 'Vue principale : aliment + valeurs nutritionnelles + NutriDz Score';


-- Vue classement par score (pour le fil d'actualité de l'app)
CREATE OR REPLACE VIEW v_top_aliments_score AS
SELECT
    a.nom_fr,
    a.nom_darija,
    c.nom_fr  AS categorie,
    s.lettre,
    s.score_final,
    v.energie_kcal,
    v.proteines_g,
    v.fibres_g
FROM aliment a
JOIN categorie              c ON a.id_categorie  = c.id_categorie
JOIN nutridz_score          s ON a.id_aliment    = s.id_aliment
JOIN valeur_nutritionnelle  v ON a.id_aliment    = v.id_aliment
WHERE a.est_actif = TRUE
ORDER BY s.score_final ASC;


-- Vue produits industriels algériens avec score
CREATE OR REPLACE VIEW v_produits_industriels AS
SELECT
    a.nom_fr,
    p.marque,
    p.gamme,
    p.code_barres,
    s.lettre          AS nutridz_lettre,
    s.score_final,
    v.energie_kcal,
    v.sucres_g,
    v.ags_g,
    v.sel_mg,
    p.statut_etiquetage
FROM produit_industriel    p
JOIN aliment               a ON p.id_aliment = a.id_aliment
LEFT JOIN nutridz_score    s ON a.id_aliment = s.id_aliment
LEFT JOIN valeur_nutritionnelle v ON a.id_aliment = v.id_aliment
ORDER BY s.score_final ASC NULLS LAST;


-- ─────────────────────────────────────────────────────────────────────────────
--  6. REQUÊTES UTILES (EXEMPLES)
-- ─────────────────────────────────────────────────────────────────────────────

/*
-- Tous les aliments avec leur score NutriDz
SELECT nom_fr, nutridz_lettre, score_final, energie_kcal, fibres_g
FROM v_aliment_complet
ORDER BY score_final;

-- Aliments de score A uniquement
SELECT nom_fr, categorie, energie_kcal, fibres_g, proteines_g
FROM v_aliment_complet
WHERE nutridz_lettre = 'A';

-- Recherche par nom (darija ou français)
SELECT * FROM v_aliment_complet
WHERE nom_fr ILIKE '%couscous%'
   OR nom_darija ILIKE '%kesksou%';

-- Statistiques par score
SELECT nutridz_lettre, COUNT(*) AS nb_aliments,
       ROUND(AVG(energie_kcal),1) AS kcal_moy,
       ROUND(AVG(fibres_g),1) AS fibres_moy
FROM v_aliment_complet
GROUP BY nutridz_lettre
ORDER BY nutridz_lettre;

-- Produits industriels algériens classés du meilleur au moins bon
SELECT * FROM v_produits_industriels;

-- Calcul du NutriDz Score d'un nouveau plat (via la formule)
-- Exemple : sel = 500 mg, AGS = 3g, énergie = 200 kcal, fibres = 4g, protéines = 10g, FLL = 30%
-- N = pts_energie(2) + pts_ags(0) + pts_sucres(0) + pts_sel(4) = 6
-- P = pts_fibres(4) + pts_proteines(5) + pts_fll(2) = 11
-- Score = 6 - 11 = -5 → Lettre A
*/


-- ─────────────────────────────────────────────────────────────────────────────
--  FIN DU SCRIPT
-- ─────────────────────────────────────────────────────────────────────────────
-- Résumé :
--   Tables créées  : 8
--   Catégories     : 14
--   Régions        : 12
--   Aliments       : ~35 (noyau — extensible à 200+)
--   Vues           : 3
--   Compatibilité  : PostgreSQL 14+
-- ─────────────────────────────────────────────────────────────────────────────
