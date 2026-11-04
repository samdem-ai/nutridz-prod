/**
 * Turns raw OCR text from a nutrition-facts label into per-100g values.
 *
 * Handles French, English and Arabic labels as printed on Algerian products:
 *  - "Valeur énergétique 1750 kJ / 418 kcal", "Énergie (kcal) 42", "الطاقة 180 كيلو كالوري"
 *  - decimal commas ("2,5 g"), "< 0,5 g", "traces"
 *  - kJ-only labels (converted with 1 kcal = 4.184 kJ)
 *  - sodium instead of salt (salt = sodium × 2.5)
 *  - "dont sucres" / "dont acides gras saturés" sub-rows
 *
 * When a label has a "per 100 g" column and a "per portion" column, the first
 * number on the row is used — on EU-style labels that is the per-100 g column.
 */

export type NutrientKey = 'calories' | 'protein' | 'carbs' | 'sugar' | 'fat' | 'fiber' | 'salt';

export interface ParsedNutrition {
  values: Partial<Record<NutrientKey, number>>;
  /** Which values were read directly vs. derived (kJ → kcal, sodium → salt). */
  derived: NutrientKey[];
  /** Values picked from ambiguous OCR readings — the admin should double-check them. */
  uncertain: NutrientKey[];
  /** Human-readable warnings for the admin (French). */
  warnings: string[];
  /** "100g" | "100ml" | null — the reference unit detected in the text. */
  basis: '100g' | '100ml' | null;
}

const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';

/** Normalise OCR noise so regexes stay simple. */
export function normaliseText(raw: string): string {
  let t = raw
    .replace(/[٠-٩]/g, (d) => String(ARABIC_DIGITS.indexOf(d)))
    .replace(/٫/g, ',')
    .replace(/[‎‏‪-‮]/g, '')
    .replace(/[|¦]/g, ' ')
    .replace(/\t/g, ' ');
  // Common OCR confusions inside numbers: "O"→0, "l"/"I"→1 when surrounded by digits
  t = t.replace(/(?<=\d)[oO](?=[\d,.\s]|g\b)/g, '0').replace(/(?<=\d[,.])[oO]/g, '0');
  t = t.replace(/(?<=\d)[lI](?=\d)/g, '1');
  return t;
}

const NUM = String.raw`(\d{1,4}(?:[.,]\d{1,3})?)`;

function toNumber(s: string): number {
  return parseFloat(s.replace(',', '.'));
}

/** Rules are tried in order; the first matching rule claims the line. */
interface Rule {
  key: NutrientKey | 'ignore';
  test: RegExp;
}

const RULES: Rule[] = [
  // Sub-rows we don't store — must come before fat/carbs so "acides gras saturés" isn't read as fat.
  { key: 'ignore', test: /satur|saturates|مشبع|polyol|amidon|starch|mono-?insat|poly-?insat|trans/i },
  { key: 'sugar', test: /sucre|sugar|سكر/i },
  { key: 'fiber', test: /fibre|fiber|ألياف|الياف/i },
  { key: 'protein', test: /prot[ée]in|بروت/i },
  { key: 'carbs', test: /glucid|carbo|hydrate|كربوهيدرات|نشويات|الكربو/i },
  { key: 'fat', test: /mati[èe]res?\s*gras|lipid|graisse|\bfat\b|total fat|دهون|الدهون|دسم/i },
  { key: 'salt', test: /\bsel\b|\bsalt\b|ملح/i },
  { key: 'salt', test: /sodium|صوديوم/i },
  { key: 'calories', test: /[ée]nerg|energy|calor|kcal|kj\b|طاقة|الطاقة|سعر/i },
];

interface Quantity {
  value: number;
  /** Other plausible readings of the same token (OCR confusions). */
  alts: number[];
  /** The primary value was already corrected from the raw token. */
  corrected: boolean;
}

/**
 * Grams value right after the label: "Protéines 3,2 g", "Protéines: <0,5", "Protéines traces".
 *
 * Tesseract often misreads the unit "g" as the digit "9" and drops decimal
 * commas, so "2,4 g" can come out as "2,49" or "249". When no unit follows the
 * number we keep alternative readings; the energy cross-check picks the right one.
 */
function firstQuantity(rest: string, rtl = false): Quantity | null {
  if (/^\W*(traces?|trace|néant|nil)\b/i.test(rest)) return { value: 0, alts: [], corrected: false };
  const m = rest.match(new RegExp(String.raw`(<\s*)?` + NUM + String.raw`\s*(mg|g)?`, 'i'));
  if (!m) return null;
  return fromToken(m[2], m[3]?.toLowerCase(), rtl);
}

/**
 * Arabic labels are read right-to-left, so OCR emits "g 20 السكريات": the
 * value (and its unit) come before the nutrient name.
 */
function quantityBefore(before: string): Quantity | null {
  const m = before.match(new RegExp(String.raw`(mg|g)?\s*(<\s*)?` + NUM + String.raw`\s*(mg|g)?[\s:]*$`, 'i'));
  if (!m) return null;
  return fromToken(m[3], (m[1] || m[4])?.toLowerCase(), true);
}

function fromToken(rawToken: string, unit: string | undefined, rtl: boolean): Quantity {
  let token = rawToken;
  let corrected = false;

  // "042" → "0,42": a leading zero is never followed directly by digits on a label.
  if (/^0\d+$/.test(token)) {
    token = `0,${token.slice(1)}`;
    corrected = true;
  }
  let value = toNumber(token);
  if (unit === 'mg') return { value: value / 1000, alts: [], corrected };

  const alts: number[] = [];
  if (!unit) {
    const insertDecimal = (t: string) => (/^\d{2,}$/.test(t) ? [toNumber(`${t.slice(0, -1)},${t.slice(-1)}`)] : []);
    if (/\d9$/.test(token)) {
      const stripped = token.slice(0, -1).replace(/[.,]$/, '');
      alts.push(toNumber(stripped), ...insertDecimal(stripped));
    }
    // RTL: the "g" sits before the number, so "g 8" can become "98"
    if (rtl && /^9\d/.test(token)) alts.push(toNumber(token.slice(1)));
    alts.push(...insertDecimal(token));
    // "34,29" — two decimals ending in 9 is almost always "34,2 g"
    if (/[.,]\d9$/.test(token) && value >= 1) {
      const fixed = toNumber(token.slice(0, -1));
      alts.unshift(value);
      value = fixed;
      corrected = true;
    }
  }
  return { value, alts: [...new Set(alts)].filter((a) => a !== value && Number.isFinite(a)), corrected };
}

function parseEnergy(line: string): { kcal?: number; kj?: number } {
  const out: { kcal?: number; kj?: number } = {};
  // "418 kcal", "418kcal", "418 Kcal", "418 كيلو كالوري", "418 سعرة"
  const kcal = line.match(new RegExp(NUM + String.raw`\s*(?:k\s*c\s*a\s*[l1i]|kcal|cal\b|كيلو\s*كالوري|كالوري|سعر)`, 'i'));
  if (kcal) out.kcal = toNumber(kcal[1]);
  const kj = line.match(new RegExp(NUM + String.raw`\s*(?:k\s*j|kilojoule|كيلو\s*جول)`, 'i'));
  if (kj) out.kj = toNumber(kj[1]);
  // "Énergie (kcal) 42" — unit before the number
  if (out.kcal === undefined) {
    const after = line.match(new RegExp(String.raw`kcal\)?\s*[:=]?\s*` + NUM, 'i'));
    if (after) out.kcal = toNumber(after[1]);
  }
  if (out.kj === undefined) {
    const after = line.match(new RegExp(String.raw`kj\)?\s*[:=]?\s*` + NUM, 'i'));
    if (after) out.kj = toNumber(after[1]);
  }
  return out;
}

interface Extraction {
  quantities: Partial<Record<Exclude<NutrientKey, 'calories'>, Quantity>>;
  kcal?: number;
  kj?: number;
  sodium?: Quantity;
  basis: ParsedNutrition['basis'];
}

function extract(raw: string): Extraction {
  const text = normaliseText(raw);
  const lines = text.split(/\r?\n/).map((l) => l.replace(/\s+/g, ' ').trim()).filter(Boolean);
  const out: Extraction = {
    quantities: {},
    basis: /100\s*m[lL]/.test(text) ? '100ml' : /100\s*g/i.test(text) ? '100g' : null,
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const rule = RULES.find((r) => r.test.test(line));
    if (!rule || rule.key === 'ignore') continue;

    if (rule.key === 'calories') {
      let e = parseEnergy(line);
      // Some labels put "kJ" on one line and "kcal" on the next.
      if (e.kcal === undefined && lines[i + 1] && /kcal|k\s*cal|كالوري/i.test(lines[i + 1])) {
        e = { ...e, ...parseEnergy(lines[i + 1]) };
      }
      if (e.kcal !== undefined && out.kcal === undefined) out.kcal = e.kcal;
      if (e.kj !== undefined && out.kj === undefined) out.kj = e.kj;
      continue;
    }

    const kw = line.match(rule.test);
    const rtl = /[\u0600-\u06FF]/.test(line);
    const rest = kw ? line.slice((kw.index ?? 0) + kw[0].length) : line;
    // Drop the Arabic article/prefix glued to the keyword ("ال" in "السكريات")
    const before = kw ? line.slice(0, kw.index ?? 0).replace(/[\u0600-\u06FF]+\s*$/, '') : '';
    let qty = /\d/.test(rest) ? firstQuantity(rest.replace(/^[^\d<]*?(?=[\d<]|traces?)/i, ''), rtl) : null;
    // Right-to-left line: value before the keyword
    if (qty === null && /\d/.test(before)) qty = quantityBefore(before);
    if (qty === null && /\b(traces?|néant)\b/i.test(rest)) qty = { value: 0, alts: [], corrected: false };
    // Value printed on the next line ("Protéines\n3,2 g")
    if (qty === null && lines[i + 1] && /^[<\d]/.test(lines[i + 1])) qty = firstQuantity(lines[i + 1], rtl);
    if (qty === null) continue;

    if (/sodium|صوديوم/i.test(line)) {
      out.sodium ??= qty;
      continue;
    }
    out.quantities[rule.key] ??= qty;
  }
  return out;
}

const ENERGY_FACTORS: Partial<Record<NutrientKey, number>> = { protein: 4, carbs: 4, fat: 9, fiber: 2 };

/**
 * Parse one or more OCR readings of the same label. The first text is the
 * primary reading; extra readings fill gaps and add alternative values.
 */
export function parseNutritionText(raw: string | string[]): ParsedNutrition {
  const texts = Array.isArray(raw) ? raw : [raw];
  const readings = texts.map(extract);
  const values: ParsedNutrition['values'] = {};
  const derived: NutrientKey[] = [];
  const uncertain = new Set<NutrientKey>();
  const warnings: string[] = [];
  const candidates: Partial<Record<NutrientKey, number[]>> = {};

  const gramKeys: Exclude<NutrientKey, 'calories'>[] = ['protein', 'carbs', 'sugar', 'fat', 'fiber', 'salt'];
  for (const key of gramKeys) {
    const all: number[] = [];
    let primary: Quantity | undefined;
    for (const r of readings) {
      const q = r.quantities[key];
      if (!q) continue;
      primary ??= q;
      all.push(q.value, ...q.alts);
    }
    if (!primary) continue;
    const plausible = [...new Set(all)].filter((v) => v >= 0 && v <= 100);
    if (!plausible.length) continue;
    let value = primary.value;
    if (value > 100) {
      value = plausible[0];
      uncertain.add(key);
    }
    if (primary.corrected) uncertain.add(key);
    values[key] = value;
    candidates[key] = [value, ...plausible.filter((v) => v !== value)];
    // Readings disagree → flag for the admin
    if (readings.some((r) => r.quantities[key] && r.quantities[key]!.value !== primary!.value)) uncertain.add(key);
  }

  const kcal = readings.find((r) => r.kcal !== undefined)?.kcal;
  const kj = readings.find((r) => r.kj !== undefined)?.kj;
  if (kcal !== undefined) values.calories = kcal;
  else if (kj !== undefined) {
    values.calories = Math.round(kj / 4.184);
    derived.push('calories');
  }
  const sodium = readings.find((r) => r.sodium)?.sodium;
  if (values.salt === undefined && sodium) {
    values.salt = Math.round(sodium.value * 2.5 * 100) / 100;
    derived.push('salt');
  }

  // Energy cross-check: choose the combination of readings whose macros best match the calories.
  if (values.calories !== undefined && values.calories > 20) {
    const keys = (Object.keys(ENERGY_FACTORS) as NutrientKey[]).filter((k) => candidates[k]);
    const options = keys.map((k) => candidates[k]!.slice(0, 4));
    const energy = (combo: number[]) => combo.reduce((sum, v, i) => sum + v * ENERGY_FACTORS[keys[i]]!, 0);
    const errOf = (combo: number[]) => Math.abs(energy(combo) - values.calories!) / values.calories!;
    const primaryCombo = keys.map((k) => values[k]!);
    let best = primaryCombo;
    let bestErr = errOf(primaryCombo);
    const walk = (i: number, acc: number[]) => {
      if (i === keys.length) {
        const e = errOf(acc);
        if (e < bestErr - 1e-9) {
          best = acc;
          bestErr = e;
        }
        return;
      }
      for (const v of options[i]) walk(i + 1, [...acc, v]);
    };
    const primaryErr = bestErr;
    if (keys.length && primaryErr > 0.08) {
      walk(0, []);
      if (bestErr < primaryErr * 0.6) {
        keys.forEach((k, i) => {
          if (values[k] !== best[i]) {
            values[k] = best[i];
            uncertain.add(k);
          }
        });
      }
    }
  }

  // Sugars can't exceed carbohydrates.
  if (values.sugar !== undefined && values.carbs !== undefined && values.sugar > values.carbs + 0.05) {
    const fit = candidates.sugar?.filter((v) => v <= values.carbs! + 0.05).sort((a, b) => b - a)[0];
    if (fit !== undefined) {
      values.sugar = fit;
      uncertain.add('sugar');
    }
  }

  // Sanity checks
  const { protein = 0, carbs = 0, fat = 0, fiber = 0, sugar, calories } = values;
  if (protein + carbs + fat + fiber > 100.5) warnings.push('La somme des macronutriments dépasse 100 g — vérifiez les valeurs.');
  if (sugar !== undefined && values.carbs !== undefined && sugar > values.carbs + 0.05) {
    warnings.push('Les sucres dépassent les glucides — une valeur est probablement mal lue.');
  }
  if (calories !== undefined && (values.protein !== undefined || values.carbs !== undefined || values.fat !== undefined)) {
    const est = 4 * protein + 4 * carbs + 9 * fat + 2 * fiber;
    if (est > 20 && Math.abs(est - calories) / est > 0.25) {
      warnings.push(`Les calories (${calories} kcal) ne correspondent pas aux macros (~${Math.round(est)} kcal).`);
    }
  }
  if (calories !== undefined && calories > 900) warnings.push('Plus de 900 kcal/100 g : la colonne « par portion » a peut-être été lue.');

  return {
    values,
    derived,
    uncertain: [...uncertain].filter((k) => !derived.includes(k)),
    warnings,
    basis: readings.find((r) => r.basis)?.basis ?? null,
  };
}

/** Rough Nutri-Score style grade (A–E) from per-100g values, used only as a suggestion. */
export function suggestNutriScore(v: Partial<Record<NutrientKey, number>>, isDrink = false): 'A' | 'B' | 'C' | 'D' | 'E' | null {
  if (v.calories === undefined) return null;
  const kj = v.calories * 4.184;
  const sugar = v.sugar ?? 0;
  const salt = v.salt ?? 0;
  const fat = v.fat ?? 0;
  const fiber = v.fiber ?? 0;
  const protein = v.protein ?? 0;

  if (isDrink) {
    const pts =
      Math.min(10, Math.floor(kj / 30)) + Math.min(10, Math.floor(sugar / 1.5)) + Math.min(10, Math.floor((salt * 400) / 90));
    if (pts <= 1) return 'B';
    if (pts <= 5) return 'C';
    if (pts <= 9) return 'D';
    return 'E';
  }

  const neg =
    Math.min(10, Math.floor(kj / 335)) +
    Math.min(10, Math.floor(sugar / 4.5)) +
    Math.min(10, Math.floor((fat * 0.35) / 1)) + // saturated fat approximated as 35 % of fat
    Math.min(10, Math.floor((salt * 400) / 90));
  const pos = Math.min(5, Math.floor(fiber / 0.9)) + Math.min(5, Math.floor(protein / 1.6));
  const score = neg - (neg >= 11 ? Math.min(5, Math.floor(fiber / 0.9)) : pos);
  if (score <= -1) return 'A';
  if (score <= 2) return 'B';
  if (score <= 10) return 'C';
  if (score <= 18) return 'D';
  return 'E';
}
