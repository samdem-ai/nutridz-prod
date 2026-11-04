import { describe, expect, it } from 'vitest';
import { parseNutritionText, suggestNutriScore } from './nutritionParser';

describe('parseNutritionText', () => {
  it('reads a typical French label with kJ/kcal and decimal commas', () => {
    const text = `Valeurs nutritionnelles moyennes pour 100 g
Valeur énergétique 1750 kJ / 418 kcal
Matières grasses 12,5 g
dont acides gras saturés 6,1 g
Glucides 68 g
dont sucres 32,4 g
Fibres alimentaires 2,1 g
Protéines 6,8 g
Sel 0,45 g`;
    const r = parseNutritionText(text);
    expect(r.values).toEqual({ calories: 418, fat: 12.5, carbs: 68, sugar: 32.4, fiber: 2.1, protein: 6.8, salt: 0.45 });
    expect(r.basis).toBe('100g');
    expect(r.derived).toEqual([]);
  });

  it('takes the per-100g column when a per-portion column follows', () => {
    const text = `Pour 100 g | Par portion (30 g)
Energie 1980 kJ 473 kcal 594 kJ 142 kcal
Lipides 22 g 6,6 g
Glucides 60 g 18 g
Protéines 7 g 2,1 g`;
    const r = parseNutritionText(text);
    expect(r.values.calories).toBe(473);
    expect(r.values.fat).toBe(22);
    expect(r.values.carbs).toBe(60);
    expect(r.values.protein).toBe(7);
  });

  it('converts kJ-only energy and sodium to salt', () => {
    const r = parseNutritionText(`Energy 176 kJ\nCarbohydrate 10.6 g\nof which sugars 10.6 g\nSodium 12 mg`);
    expect(r.values.calories).toBe(42);
    expect(r.values.salt).toBe(0.03);
    expect(r.derived.sort()).toEqual(['calories', 'salt']);
  });

  it('handles "<", traces, unit-before-number and values on the next line', () => {
    const r = parseNutritionText(`Énergie (kcal) 42\nMatières grasses < 0,5 g\nFibres traces\nProtéines\n0,1 g\nper 100 ml`);
    expect(r.values.calories).toBe(42);
    expect(r.values.fat).toBe(0.5);
    expect(r.values.fiber).toBe(0);
    expect(r.values.protein).toBe(0.1);
    expect(r.basis).toBe('100ml');
  });

  it('reads Arabic labels and Arabic-Indic digits', () => {
    const text = `القيمة الغذائية لكل 100 غ
الطاقة ٣٨٠ كيلو كالوري
البروتين 8 غ
الكربوهيدرات 75 غ
السكريات 20 غ
الدهون 5,5 غ
الملح 0,8 غ`;
    const r = parseNutritionText(text);
    expect(r.values).toMatchObject({ calories: 380, protein: 8, carbs: 75, sugar: 20, fat: 5.5, salt: 0.8 });
  });

  it('fixes OCR letter-O-for-zero inside numbers', () => {
    const r = parseNutritionText(`Protéines 1O,5 g\nSel 0,O8 g`);
    expect(r.values.protein).toBe(10.5);
    expect(r.values.salt).toBe(0.08);
  });

  it('warns when sugar is higher than carbs or macros exceed 100 g', () => {
    const r = parseNutritionText(`Glucides 10 g\ndont sucres 40 g\nLipides 80 g\nProtéines 30 g`);
    expect(r.warnings.length).toBeGreaterThanOrEqual(2);
  });

  it('returns nothing for unrelated text', () => {
    const r = parseNutritionText('Ingrédients : eau, sucre, arôme naturel. A consommer de préférence avant...');
    expect(r.values.calories).toBeUndefined();
    expect(r.values.protein).toBeUndefined();
  });
});

describe('suggestNutriScore', () => {
  it('grades water-like drinks as B and sugary sodas worse', () => {
    expect(suggestNutriScore({ calories: 0, sugar: 0 }, true)).toBe('B');
    expect(['D', 'E']).toContain(suggestNutriScore({ calories: 42, sugar: 10.6 }, true));
  });
  it('grades chocolate biscuits worse than plain yogurt', () => {
    const biscuit = suggestNutriScore({ calories: 480, sugar: 35, fat: 22, salt: 0.6, fiber: 2, protein: 6 })!;
    const yogurt = suggestNutriScore({ calories: 60, sugar: 4, fat: 1.5, salt: 0.1, protein: 4 })!;
    expect(biscuit > yogurt).toBe(true);
  });
});

describe('OCR confusion recovery', () => {
  // Real Tesseract outputs for a label reading:
  // 470 kcal · fat 21,5 g · carbs 62 g · sugars 34,2 g · fibre 2,4 g · protein 5,9 g · salt 0,42 g
  const PREPROCESSED = `Valeurs nutritionnelles pour 100 g
Valeur énergétique 1966 kJ / 470 kcal
Matières grasses 21,5 g
dont acides gras saturés 989
Glucides 62g
dont sucres 34,29
Fibres alimentaires 249
Protéines 5,99
Sel 0,42g`;
  const RAW = `Valeurs nutritionnelles pour 100 g
Valeur énergétique 1966 kJ / 470 kcal
Matières grasses 21,59
dont acides gras saturés 9,8g
Glucides 62g
dont sucres 34,29
Fibres alimentaires 24g
Protéines 5,9g
Sel 042g`;

  it('recovers the true values from a single noisy reading', () => {
    const r = parseNutritionText(PREPROCESSED);
    expect(r.values).toEqual({ calories: 470, fat: 21.5, carbs: 62, sugar: 34.2, fiber: 2.4, protein: 5.9, salt: 0.42 });
    expect(r.uncertain).toEqual(expect.arrayContaining(['fiber', 'sugar', 'protein']));
    expect(r.warnings).toEqual([]);
  });

  it('recovers from the other reading too ("042g", dropped comma in "24g")', () => {
    const r = parseNutritionText(RAW);
    expect(r.values.salt).toBe(0.42);
    expect(r.values.fat).toBe(21.5);
    expect(r.values.protein).toBe(5.9);
  });

  it('merges two readings', () => {
    const r = parseNutritionText([PREPROCESSED, RAW]);
    expect(r.values).toEqual({ calories: 470, fat: 21.5, carbs: 62, sugar: 34.2, fiber: 2.4, protein: 5.9, salt: 0.42 });
  });

  it('keeps clean values untouched', () => {
    const r = parseNutritionText('Énergie 42 kcal\nGlucides 10,5 g\ndont sucres 10,5 g\nSel 0,29 g');
    expect(r.values).toEqual({ calories: 42, carbs: 10.5, sugar: 10.5, salt: 0.29 });
    expect(r.uncertain).toEqual([]);
  });
});

describe('right-to-left OCR output', () => {
  // Real Tesseract output for an Arabic label: 380 kcal · protein 8 g · carbs 75 g · sugars 20 g · fat 5,5 g · salt 0,8 g
  const AR = 'القيمة الغذائية لكل 100 غ\n\nالطاقة 380 ‎kcal‏\n‏البروتين 98\nالكربوهيدرات 75 ‎g‏\n\ng 20 ‏السكريات‎\n\ng 5,5 ‏الدهون‎\n‎g0,8 ‏الملح‎\n';
  it('reads values printed before the nutrient name and fixes "g 8" → "98"', () => {
    const r = parseNutritionText(AR);
    expect(r.values).toEqual({ calories: 380, protein: 8, carbs: 75, sugar: 20, fat: 5.5, salt: 0.8 });
    expect(r.uncertain).toContain('protein');
  });
});
