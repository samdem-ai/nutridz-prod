import os
import base64
import logging
import httpx
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "google/gemini-2.5-flash-lite")
OPENROUTER_VISION_MODEL = os.getenv("OPENROUTER_VISION_MODEL", "google/gemini-2.5-flash-lite")
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
# OpenRouter best-practice headers (analytics / leaderboards)
OPENROUTER_REFERER = os.getenv("OPENROUTER_REFERER", "https://nutridz.app")
OPENROUTER_TITLE = os.getenv("OPENROUTER_TITLE", "NutriDz")

# ── Label OCR vision provider (Groq by default; any OpenAI-compatible API) ──
# Groq's vision line-up changes; confirm the current id with GET {base}/models
# (exposed as /ai/vision-models) and set VISION_MODEL accordingly.
VISION_API_KEY = os.getenv("VISION_API_KEY", "")
VISION_BASE_URL = os.getenv("VISION_BASE_URL", "https://api.groq.com/openai/v1")
VISION_MODEL = os.getenv("VISION_MODEL", "qwen/qwen3.8-27b")

# ── Jev cascade (prototype) ──────────────────────────────────────────
# Dish classification step tried before the Gemini vision call on meal
# photos. Jev is TypeSafe's decision model, reached through OpenRouter's
# Decisions API with the SAME OPENROUTER_API_KEY above — no extra secret.
# Off by default: TypeSafe's own docs call Jev's image input a preview
# feature, and this dish list has not been checked against real photos.
# See docs/AI.md#jev-cascade-prototype before turning it on.
DECISIONS_API_URL = "https://openrouter.ai/api/alpha/decisions"
JEV_ENABLED = os.getenv("JEV_ENABLED", "false").strip().lower() in ("1", "true", "yes")
JEV_MODEL = os.getenv("JEV_MODEL", "typesafe/jev-1.14")
JEV_CONFIDENCE_THRESHOLD = float(os.getenv("JEV_CONFIDENCE_THRESHOLD", "0.8"))

app = FastAPI(
    title="Nutridz AI Service",
    description="AI-powered nutrition assistant — Algerian cuisine focused",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Models ──────────────────────────────────────────────────────────


class UserContext(BaseModel):
    nutritionGoal: Optional[str] = None
    dailyCalorieTarget: Optional[float] = None
    dailyProteinTarget: Optional[float] = None
    dailyCarbTarget: Optional[float] = None
    dailyFatTarget: Optional[float] = None
    diabetesType: Optional[str] = "NONE"
    allergies: Optional[str] = None
    activityLevel: Optional[str] = None
    weightKg: Optional[float] = None
    heightCm: Optional[float] = None


class HistoryMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    message: str
    userContext: Optional[UserContext] = None
    history: Optional[List[HistoryMessage]] = []


class MealAnalysisRequest(BaseModel):
    mealDescription: str
    userContext: Optional[UserContext] = None


class MealPlanRequest(BaseModel):
    days: int = 3
    userContext: Optional[UserContext] = None
    preferAlgerian: Optional[bool] = True
    vegetarian: Optional[bool] = False
    lowCarb: Optional[bool] = False


# ── Algerian dishes reference ──────────────────────────────────────

ALGERIAN_DISHES = [
    "couscous", "chorba frik", "chorba beida", "rechta", "tajine zitoune",
    "chakchouka", "mhajeb", "loubia", "hrira", "berkoukes",
    "rfiss", "dolma", "bourek", "ktayef", "makroud",
    "garantita", "matlouh", "kesra", "chakhchoukha",
    "doubara", "lham lahlou", "mderbel", "felfla mechouia",
]

# ── Helpers ────────────────────────────────────────────────────────


def build_user_profile_text(ctx: Optional[UserContext]) -> str:
    if not ctx:
        return "Profil utilisateur non disponible."

    parts: List[str] = []

    if ctx.nutritionGoal:
        goals = {
            "WEIGHT_LOSS": "perte de poids",
            "MUSCLE_GAIN": "prise de masse",
            "MAINTENANCE": "maintien du poids",
            "BALANCED": "alimentation equilibree",
            "SPECIFIC_DIET": "regime specifique",
        }
        parts.append(f"Objectif: {goals.get(ctx.nutritionGoal, ctx.nutritionGoal)}")

    if ctx.dailyCalorieTarget:
        parts.append(f"Calories cibles: {ctx.dailyCalorieTarget:.0f} kcal/jour")
    if ctx.dailyProteinTarget:
        parts.append(f"Proteines: {ctx.dailyProteinTarget:.0f}g/jour")
    if ctx.dailyCarbTarget:
        parts.append(f"Glucides: {ctx.dailyCarbTarget:.0f}g/jour")
    if ctx.dailyFatTarget:
        parts.append(f"Lipides: {ctx.dailyFatTarget:.0f}g/jour")

    if ctx.diabetesType and ctx.diabetesType != "NONE":
        parts.append(f"Diabete: {ctx.diabetesType.replace('_', ' ')}")
    if ctx.allergies:
        parts.append(f"Allergies: {ctx.allergies}")
    if ctx.weightKg and ctx.heightCm:
        bmi = ctx.weightKg / ((ctx.heightCm / 100) ** 2)
        parts.append(f"IMC: {bmi:.1f}")

    return "\n".join(parts) if parts else "Profil incomplet."


async def openrouter_chat(
    messages: List[dict],
    *,
    max_tokens: int = 1024,
    temperature: float = 0.4,
    model: Optional[str] = None,
) -> str:
    """Call OpenRouter chat-completions endpoint (OpenAI-compatible)."""
    if not OPENROUTER_API_KEY:
        raise RuntimeError("OPENROUTER_API_KEY not configured")

    payload = {
        "model": model or OPENROUTER_MODEL,
        "messages": messages,
        "max_tokens": max_tokens,
        "temperature": temperature,
        "top_p": 1.0,
        "frequency_penalty": 0.0,
        "presence_penalty": 0.0,
        "stream": False,
    }
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Accept": "application/json",
        "Content-Type": "application/json",
        "HTTP-Referer": OPENROUTER_REFERER,
        "X-Title": OPENROUTER_TITLE,
    }
    async with httpx.AsyncClient(timeout=60.0) as client:
        r = await client.post(OPENROUTER_URL, json=payload, headers=headers)
        r.raise_for_status()
        data = r.json()
    return data["choices"][0]["message"]["content"]


# Back-compat alias so existing call sites work
nvidia_chat = openrouter_chat


SYSTEM_NUTRITIONIST = (
    "Tu es un nutritionniste professionnel et bienveillant pour l'application Nutridz. "
    "Tu es specialise dans la cuisine algerienne traditionnelle et la nutrition saine.\n\n"
    f"Plats algeriens que tu connais bien: {', '.join(ALGERIAN_DISHES[:12])}, et bien d'autres.\n\n"
    "Regles importantes:\n"
    "- Reponds TOUJOURS dans la meme langue que l'utilisateur (francais, arabe, darija algerienne, ou anglais)\n"
    "- Sois concis, chaleureux et pratique\n"
    "- Valorise les plats algeriens traditionnels quand c'est pertinent\n"
    "- Adapte tes conseils au profil de l'utilisateur (diabete, allergies, objectifs)\n"
    "- Ne donne jamais de conseils medicaux, oriente vers un medecin si necessaire\n"
    "- Pour la darija, utilise des expressions naturelles algeriennes"
)


# ── Endpoints ──────────────────────────────────────────────────────


@app.get("/health")
def health():
    return {"status": "ok", "service": "nutridz-ai", "provider": "openrouter", "model": OPENROUTER_MODEL}


@app.post("/ai/chat")
async def chat(request: ChatRequest):
    try:
        profile = build_user_profile_text(request.userContext)
        system_msg = f"{SYSTEM_NUTRITIONIST}\n\nProfil de l'utilisateur:\n{profile}"

        messages: List[dict] = [{"role": "system", "content": system_msg}]
        for msg in (request.history or []):
            role = "user" if msg.role == "USER" else "assistant"
            messages.append({"role": role, "content": msg.content})
        messages.append({"role": "user", "content": request.message})

        reply = await nvidia_chat(messages, max_tokens=1024, temperature=0.5)
        return {"reply": reply}
    except Exception as e:
        logger.error(f"Chat error: {e}")
        return {"reply": "Je suis desole, je rencontre des difficultes. Veuillez reessayer."}


@app.post("/ai/analyze-meal")
async def analyze_meal(request: MealAnalysisRequest):
    try:
        profile = build_user_profile_text(request.userContext)
        prompt = (
            f"Analyse nutritionnelle du repas: \"{request.mealDescription}\"\n\n"
            f"Profil utilisateur:\n{profile}\n\n"
            "Fournis une analyse structuree avec:\n"
            "1. Calories estimees\n"
            "2. Macronutriments (proteines, glucides, lipides)\n"
            "3. Score nutritionnel (A/B/C/D/E) avec justification courte\n"
            "4. Points positifs (maximum 2)\n"
            "5. Une suggestion d'amelioration concrete adaptee au profil\n\n"
            "Si c'est un plat algerien traditionnel, mentionne ses bienfaits culturels et nutritionnels.\n"
            "Reponds dans la meme langue que la description du repas."
        )
        reply = await nvidia_chat(
            [
                {"role": "system", "content": SYSTEM_NUTRITIONIST},
                {"role": "user", "content": prompt},
            ],
            max_tokens=1024,
            temperature=0.3,
        )
        return {"analysis": reply}
    except Exception as e:
        logger.error(f"Meal analysis error: {e}")
        return {"analysis": "Analyse non disponible pour le moment."}


@app.post("/ai/meal-plan")
async def generate_meal_plan(request: MealPlanRequest):
    try:
        profile = build_user_profile_text(request.userContext)

        prefs = []
        if request.preferAlgerian:
            prefs.append("prioritiser les plats algeriens traditionnels")
        if request.vegetarian:
            prefs.append("vegetarien")
        if request.lowCarb:
            prefs.append("faible en glucides")
        pref_text = ", ".join(prefs) if prefs else "equilibre"

        prompt = (
            f"Cree un plan alimentaire de {request.days} jours pour un utilisateur algerien.\n\n"
            f"Profil:\n{profile}\n\n"
            f"Preferences: {pref_text}\n\n"
            "Pour chaque jour, fournis:\n"
            "- Petit-dejeuner avec calories approximatives\n"
            "- Dejeuner avec calories approximatives\n"
            "- Diner avec calories approximatives\n"
            "- Collation avec calories approximatives\n"
            "- Eau recommandee en litres\n"
            "- Total journalier en calories\n\n"
            f"Plats algeriens a varier: {', '.join(ALGERIAN_DISHES[:8])}.\n"
            "Adapte les portions au profil de l'utilisateur.\n"
            "Reponds en francais."
        )
        reply = await nvidia_chat(
            [
                {"role": "system", "content": SYSTEM_NUTRITIONIST},
                {"role": "user", "content": prompt},
            ],
            max_tokens=2048,
            temperature=0.5,
        )
        return {"plan": reply}
    except Exception as e:
        logger.error(f"Meal plan error: {e}")
        return {"plan": "Plan alimentaire non disponible pour le moment."}


@app.post("/ai/suggest-improvement")
async def suggest_improvement(request: MealAnalysisRequest):
    try:
        profile = build_user_profile_text(request.userContext)
        prompt = (
            f"L'utilisateur a mange aujourd'hui: {request.mealDescription}\n\n"
            f"Profil:\n{profile}\n\n"
            "Sur la base de ce qu'il a mange et de son profil, fournis:\n"
            "1. Ce qui manque nutritionnellement dans sa journee\n"
            "2. Trois suggestions concretes pour le reste de la journee, avec des options algeriennes\n"
            "3. La quantite d'eau restante a boire\n\n"
            "Sois tres concis et pratique. Reponds en francais."
        )
        reply = await nvidia_chat(
            [
                {"role": "system", "content": SYSTEM_NUTRITIONIST},
                {"role": "user", "content": prompt},
            ],
            max_tokens=1024,
            temperature=0.4,
        )
        return {"suggestion": reply}
    except Exception as e:
        logger.error(f"Suggestion error: {e}")
        return {"suggestion": "Suggestions non disponibles pour le moment."}


# ── Jev cascade: closed-list dish lookup before the Gemini call ────
#
# PROTOTYPE values. Calories/macros below are rough per-100g estimates for
# NutriDz's own known dish list, in the same spirit as the hardcoded drink
# values in the Gemini vision prompt further down — NOT verified against
# the real `foods` table. The Java backend's resolveDetectedFood() already
# prefers a DB match by name over whatever this service returns, so these
# numbers are only the fallback used the first time a dish is auto-created.
# Verify them (or better: seed these dishes into the DB) before relying on
# this cascade in production. See docs/AI.md#jev-cascade-prototype.
ALGERIAN_DISH_NUTRITION: dict = {
    "couscous":         {"name": "Couscous",         "nameAr": "كسكسي",     "caloriesPer100g": 180, "proteinPer100g": 5,  "carbsPer100g": 30, "fatPer100g": 4,  "nutritionalScore": "B", "defaultPortionGrams": 350},
    "chorba frik":      {"name": "Chorba Frik",       "nameAr": "شربة فريك", "caloriesPer100g": 70,  "proteinPer100g": 4,  "carbsPer100g": 10, "fatPer100g": 2,  "nutritionalScore": "B", "defaultPortionGrams": 300},
    "chorba beida":     {"name": "Chorba Beida",      "nameAr": "شربة بيضاء","caloriesPer100g": 60,  "proteinPer100g": 3,  "carbsPer100g": 8,  "fatPer100g": 2,  "nutritionalScore": "B", "defaultPortionGrams": 300},
    "rechta":           {"name": "Rechta",            "nameAr": "رشتة",      "caloriesPer100g": 190, "proteinPer100g": 6,  "carbsPer100g": 32, "fatPer100g": 4,  "nutritionalScore": "B", "defaultPortionGrams": 300},
    "tajine zitoune":   {"name": "Tajine Zitoune",    "nameAr": "طاجين زيتون","caloriesPer100g": 210, "proteinPer100g": 15, "carbsPer100g": 6,  "fatPer100g": 14, "nutritionalScore": "B", "defaultPortionGrams": 300},
    "chakchouka":       {"name": "Chakchouka",        "nameAr": "شكشوكة",    "caloriesPer100g": 120, "proteinPer100g": 5,  "carbsPer100g": 8,  "fatPer100g": 8,  "nutritionalScore": "B", "defaultPortionGrams": 250},
    "mhajeb":           {"name": "Mhajeb",            "nameAr": "محاجب",     "caloriesPer100g": 260, "proteinPer100g": 6,  "carbsPer100g": 30, "fatPer100g": 12, "nutritionalScore": "C", "defaultPortionGrams": 200},
    "loubia":           {"name": "Loubia",            "nameAr": "لوبية",     "caloriesPer100g": 140, "proteinPer100g": 8,  "carbsPer100g": 20, "fatPer100g": 3,  "nutritionalScore": "B", "defaultPortionGrams": 300},
    "hrira":            {"name": "Hrira",             "nameAr": "حريرة",     "caloriesPer100g": 90,  "proteinPer100g": 5,  "carbsPer100g": 14, "fatPer100g": 2,  "nutritionalScore": "B", "defaultPortionGrams": 300},
    "berkoukes":        {"name": "Berkoukes",         "nameAr": "بركوكس",    "caloriesPer100g": 150, "proteinPer100g": 6,  "carbsPer100g": 25, "fatPer100g": 3,  "nutritionalScore": "B", "defaultPortionGrams": 300},
    "rfiss":            {"name": "Rfiss",             "nameAr": "رفيس",      "caloriesPer100g": 300, "proteinPer100g": 5,  "carbsPer100g": 45, "fatPer100g": 10, "nutritionalScore": "C", "defaultPortionGrams": 150},
    "dolma":            {"name": "Dolma",             "nameAr": "دولمة",     "caloriesPer100g": 160, "proteinPer100g": 6,  "carbsPer100g": 18, "fatPer100g": 7,  "nutritionalScore": "B", "defaultPortionGrams": 250},
    "bourek":           {"name": "Bourek",            "nameAr": "بوراك",     "caloriesPer100g": 280, "proteinPer100g": 8,  "carbsPer100g": 25, "fatPer100g": 16, "nutritionalScore": "C", "defaultPortionGrams": 150},
    "ktayef":           {"name": "Ktayef",             "nameAr": "قطايف",     "caloriesPer100g": 350, "proteinPer100g": 6,  "carbsPer100g": 45, "fatPer100g": 15, "nutritionalScore": "D", "defaultPortionGrams": 100},
    "makroud":          {"name": "Makroud",            "nameAr": "مقروض",     "caloriesPer100g": 380, "proteinPer100g": 4,  "carbsPer100g": 55, "fatPer100g": 16, "nutritionalScore": "D", "defaultPortionGrams": 80},
    "garantita":        {"name": "Garantita",          "nameAr": "كرنتيطة",   "caloriesPer100g": 150, "proteinPer100g": 6,  "carbsPer100g": 20, "fatPer100g": 5,  "nutritionalScore": "B", "defaultPortionGrams": 200},
    "matlouh":          {"name": "Matlouh",             "nameAr": "مطلوع",     "caloriesPer100g": 290, "proteinPer100g": 7,  "carbsPer100g": 50, "fatPer100g": 6,  "nutritionalScore": "B", "defaultPortionGrams": 100},
    "kesra":            {"name": "Kesra",               "nameAr": "كسرة",      "caloriesPer100g": 280, "proteinPer100g": 8,  "carbsPer100g": 52, "fatPer100g": 3,  "nutritionalScore": "B", "defaultPortionGrams": 150},
    "chakhchoukha":     {"name": "Chakhchoukha",        "nameAr": "شخشوخة",    "caloriesPer100g": 220, "proteinPer100g": 7,  "carbsPer100g": 28, "fatPer100g": 8,  "nutritionalScore": "B", "defaultPortionGrams": 350},
    "doubara":          {"name": "Doubara",             "nameAr": "دوبارة",    "caloriesPer100g": 130, "proteinPer100g": 6,  "carbsPer100g": 20, "fatPer100g": 3,  "nutritionalScore": "B", "defaultPortionGrams": 300},
    "lham lahlou":      {"name": "Lham Lahlou",         "nameAr": "لحم لحلو",  "caloriesPer100g": 320, "proteinPer100g": 18, "carbsPer100g": 15, "fatPer100g": 20, "nutritionalScore": "C", "defaultPortionGrams": 250},
    "mderbel":          {"name": "Mderbel",             "nameAr": "مدربل",     "caloriesPer100g": 150, "proteinPer100g": 4,  "carbsPer100g": 20, "fatPer100g": 6,  "nutritionalScore": "B", "defaultPortionGrams": 250},
    "felfla mechouia":  {"name": "Felfla Mechouia",     "nameAr": "فلفلة مشوية","caloriesPer100g": 70,  "proteinPer100g": 2,  "carbsPer100g": 8,  "fatPer100g": 3,  "nutritionalScore": "A", "defaultPortionGrams": 150},
}
assert set(ALGERIAN_DISH_NUTRITION) == set(ALGERIAN_DISHES), "Jev dish list and nutrition table drifted apart"

_JEV_PORTION_LEVELS = ["petite", "moyenne", "grande"]
_JEV_PORTION_MULTIPLIER = {"petite": 0.6, "moyenne": 1.0, "grande": 1.5}


async def _jev_decision(state: list, questions: dict) -> dict:
    """POST to OpenRouter's Decisions API (alpha). Same key as openrouter_chat,
    different endpoint — see https://openrouter.ai/docs/api/decisions."""
    if not OPENROUTER_API_KEY:
        raise RuntimeError("OPENROUTER_API_KEY not configured")
    payload = {"model": JEV_MODEL, "state": state, "questions": questions}
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": OPENROUTER_REFERER,
        "X-Title": OPENROUTER_TITLE,
        # TypeSafe's own docs require this for image requests; OpenRouter's
        # Decisions API accepted the same request without it in testing, but
        # sending it costs nothing and guards against that changing.
        "TypeSafe-Danger-Zone-Images": "true",
    }
    async with httpx.AsyncClient(timeout=20.0) as client:
        r = await client.post(DECISIONS_API_URL, json=payload, headers=headers)
        r.raise_for_status()
        return r.json()


async def _classify_dish_with_jev(image_bytes: bytes, mime: str) -> Optional[dict]:
    """Cascade step tried before the full Gemini vision analysis: ask Jev to
    pick the dish from NutriDz's closed list of known Algerian dishes.

    Returns a detectedFoods-shaped dict (same shape as
    _analyze_image_structured) when Jev confidently names a known dish, or
    None to fall back to Gemini — the same behaviour as if this cascade
    were disabled. Never raises: any failure (disabled, no key, network,
    unexpected response shape) just falls back.
    """
    if not JEV_ENABLED:
        return None
    try:
        b64 = base64.b64encode(image_bytes).decode()
        dish_criteria = {name: None for name in ALGERIAN_DISH_NUTRITION}
        dish_criteria["autre"] = (
            "Un plat qui n'est pas dans cette liste, un plat non-algerien, "
            "une boisson, ou aucun aliment identifiable sur la photo."
        )
        state = [
            "Photo d'un repas prise par un utilisateur de l'application NutriDz.",
            {"type": "image_url", "image_url": {"url": f"data:{mime};base64,{b64}"}},
        ]
        questions = {
            "dish": {
                "type": "choice",
                "instructions": (
                    "Quel plat de cette liste est visible sur la photo ? Si ce "
                    "n'est pas l'un de ces plats, ou en cas de doute, choisis 'autre' "
                    "plutot que de deviner."
                ),
                "criteria": dish_criteria,
            },
            "portion": {
                "type": "score",
                "instructions": "Quelle est la taille de la portion visible dans l'assiette ?",
                # Score criteria is an ORDERED ARRAY (low → high), unlike
                # Choice's criteria object — confirmed against the live API,
                # which 400s on a dict here even though community docs show one.
                "criteria": _JEV_PORTION_LEVELS,
            },
        }
        data = await _jev_decision(state, questions)
        answers = data.get("answers", {})
        dish_answer = answers.get("dish", {})
        dish = dish_answer.get("choice")
        confidence = dish_answer.get("confidence") or 0

        if not dish or dish == "autre" or dish not in ALGERIAN_DISH_NUTRITION or confidence < JEV_CONFIDENCE_THRESHOLD:
            logger.info(f"Jev cascade: no confident match (dish={dish!r}, confidence={confidence}) — falling back to Gemini")
            return None

        base = ALGERIAN_DISH_NUTRITION[dish]
        portion_score = answers.get("portion", {}).get("score")
        multiplier = 1.0
        if isinstance(portion_score, (int, float)):
            level = _JEV_PORTION_LEVELS[min(2, max(0, round(portion_score)))]
            multiplier = _JEV_PORTION_MULTIPLIER[level]

        logger.info(f"Jev cascade: matched '{dish}' at confidence {confidence:.2f} — skipping Gemini")
        return {
            "detectedFoods": [{
                "name": base["name"],
                "nameAr": base["nameAr"],
                "confidence": round(float(confidence), 2),
                "caloriesPer100g": base["caloriesPer100g"],
                "proteinPer100g": base["proteinPer100g"],
                "carbsPer100g": base["carbsPer100g"],
                "fatPer100g": base["fatPer100g"],
                "nutritionalScore": base["nutritionalScore"],
                "estimatedPortionGrams": round(base["defaultPortionGrams"] * multiplier),
            }],
            "advice": "",
            "source": "jev_cascade",
        }
    except Exception as e:
        logger.warning(f"Jev cascade failed, falling back to Gemini: {e}")
        return None


# ── Image analysis (multimodal) ────────────────────────────────────


def _guess_mime(filename: Optional[str], fallback: str = "image/jpeg") -> str:
    if not filename:
        return fallback
    ext = filename.rsplit(".", 1)[-1].lower()
    return {"jpg": "image/jpeg", "jpeg": "image/jpeg", "png": "image/png",
            "webp": "image/webp", "gif": "image/gif"}.get(ext, fallback)


import json as json_lib
import re


async def _analyze_image_structured(
    image_bytes: bytes,
    mime: str,
    user_ctx: Optional[UserContext] = None,
) -> dict:
    """Returns structured JSON. Refuses if image contains no food."""
    b64 = base64.b64encode(image_bytes).decode()
    profile = build_user_profile_text(user_ctx)
    prompt = (
        "ETAPE 1 — Classifie la photo dans EXACTEMENT une categorie avant tout:\n"
        "  (A) BOISSON: liquide visible dans un verre, bouteille, carafe, mug, tasse, canette, bouteille en plastique.\n"
        "  (B) ALIMENT SOLIDE: plat cuisine, fruit, legume, pain, viande, patisserie sur assiette ou plateau.\n"
        "  (C) NI L'UN NI L'AUTRE: personne, paysage, objet inerte, ecran, animal.\n\n"
        "Si (A) → applique la TABLE BOISSONS ci-dessous, ne consulte JAMAIS la liste des plats.\n"
        "Si (B) → identifie le plat (algerien ou international).\n"
        "Si (C) → retourne {\"detectedFoods\": [], \"advice\": \"Pas d'aliment visible. Prends une photo de ton plat.\"}\n\n"
        "TABLE BOISSONS (utilise STRICTEMENT cette table pour les liquides):\n"
        "- Liquide transparent/incolore dans verre ou bouteille → name: \"Eau\", nameAr: \"ماء\", 0 kcal/100g, score A.\n"
        "- Liquide marron fonce ou noir chaud → name: \"Cafe\" (3 kcal) ou \"The\" (1 kcal), score A.\n"
        "- Liquide jaune/orange opaque (jus) → name: \"Jus de fruit\", ~45 kcal/100g, score C.\n"
        "- Liquide blanc opaque → name: \"Lait\" (~50 kcal) ou \"L'ben\" (~40 kcal), score B.\n"
        "- Boisson gazeuse foncee (cola): LIS L'ETIQUETTE avant de nommer.\n"
        "    * Logo Coca-Cola en script rouge clairement visible → name: \"Coca-Cola\", ~42 kcal/100g, score E.\n"
        "    * Etiquette \"SELECTO\" ou \"Hamoud Boualem\" → name: \"Selecto 25cl (Hamoud Boualem)\", nameAr: \"سيلكتو 25سل\", ~41 kcal/100g, score D.\n"
        "    * Bouteille en verre 25cl/33cl dans contexte algerien sans logo Coca-Cola lisible → prefere \"Selecto 25cl (Hamoud Boualem)\".\n"
        "- Boisson gazeuse claire/citron (Algerie): etiquette \"Hamoud\" blanche/bleue ou \"La Blanche\" → name: \"Hamoud La Blanche 25cl (Hamoud Boualem)\", nameAr: \"حمود لابلانش 25سل\", ~41 kcal/100g, score D.\n"
        "- Petit-lait/yaourt liquide → name: \"L'ben\" ou \"Raib\", score B.\n"
        "INTERDIT pour boissons: arayach, makroud, mhajeb, ou tout nom de patisserie/solide.\n\n"
        "PLATS SOLIDES (utilise seulement si ETAPE 1 = B):\n"
        "Plats algeriens connus: couscous, chorba, chakchouka, mhajeb, tajine, bourek, dolma, hrira, makroud, baklava, kesra, matlouh.\n"
        "Plats internationaux: pasta, pizza, salade, riz, viande grillee, etc.\n\n"
        "Reponds UNIQUEMENT avec ce JSON (pas de markdown, pas de texte):\n"
        "{\n"
        '  "detectedFoods": [\n'
        '    {\n'
        '      "name": "Nom en francais",\n'
        '      "nameAr": "Nom en arabe ou null",\n'
        '      "confidence": 0.85,\n'
        '      "caloriesPer100g": 165,\n'
        '      "proteinPer100g": 12,\n'
        '      "carbsPer100g": 25,\n'
        '      "fatPer100g": 5,\n'
        '      "nutritionalScore": "B",\n'
        '      "estimatedPortionGrams": 250\n'
        '    }\n'
        '  ],\n'
        '  "advice": "Court conseil personnalise (max 2 phrases)"\n'
        "}\n\n"
        f"Profil utilisateur:\n{profile}\n\n"
        "Score nutritionnel: A=tres sain, B=sain, C=moyen, D=peu sain, E=mauvais. "
        "Donne une confidence realiste (0.5-0.95). "
        "REPONDS EN JSON UNIQUEMENT."
    )
    messages = [
        {
            "role": "user",
            "content": [
                {"type": "text", "text": prompt},
                {"type": "image_url",
                 "image_url": {"url": f"data:{mime};base64,{b64}"}},
            ],
        },
    ]
    raw = await openrouter_chat(messages, max_tokens=1024, temperature=0.1, model=OPENROUTER_VISION_MODEL)
    match = re.search(r'\{[\s\S]*\}', raw)
    if not match:
        return {"detectedFoods": [], "advice": "Reponse non comprise. Reessaye."}
    try:
        result = json_lib.loads(match.group())
    except Exception:
        return {"detectedFoods": [], "advice": "Erreur d'analyse. Reessaye."}

    # Filter out very low confidence (< 0.4) but keep reasonable detections
    foods = result.get("detectedFoods", [])
    foods = [f for f in foods if (f.get("confidence") or 0.7) >= 0.4]
    result["detectedFoods"] = foods
    if not foods and not result.get("advice"):
        result["advice"] = "Aucun plat clairement identifie. Prends une photo plus nette."
    return result


async def _analyze_image_with_cascade(
    image_bytes: bytes,
    mime: str,
    user_ctx: Optional[UserContext] = None,
) -> dict:
    """Entry point for both image-analysis endpoints: try the Jev cascade
    first (no-op unless JEV_ENABLED), fall back to the Gemini vision call."""
    jev_result = await _classify_dish_with_jev(image_bytes, mime)
    if jev_result is not None:
        return jev_result
    return await _analyze_image_structured(image_bytes, mime, user_ctx)


# JSON variant — base64 in body
class ImageAnalysisRequest(BaseModel):
    imageBase64: str
    mimeType: Optional[str] = "image/jpeg"
    userContext: Optional[UserContext] = None


@app.post("/ai/analyze-food-image")
async def analyze_food_image_json(request: ImageAnalysisRequest):
    try:
        img_bytes = base64.b64decode(request.imageBase64)
        result = await _analyze_image_with_cascade(
            img_bytes, request.mimeType or "image/jpeg", request.userContext,
        )
        return result
    except Exception as e:
        logger.error(f"Image analysis error: {e}")
        return {"detectedFoods": [], "advice": "Analyse non disponible. Reessaye avec une photo plus claire.", "error": str(e)}


# Multipart variant
@app.post("/ai/analyze-image")
async def analyze_image_multipart(image: UploadFile = File(...)):
    try:
        img_bytes = await image.read()
        mime = _guess_mime(image.filename, fallback=image.content_type or "image/jpeg")
        result = await _analyze_image_with_cascade(img_bytes, mime, None)
        return result
    except Exception as e:
        logger.error(f"Image analysis error: {e}")
        return {"detectedFoods": [], "advice": "Analyse non disponible. Reessaye avec une photo plus claire.", "error": str(e)}


# ── Label OCR (nutrition facts table → structured per-100g) ─────────

async def vision_chat(messages: List[dict], *, max_tokens: int = 800, temperature: float = 0.0) -> str:
    """Call the configured OpenAI-compatible vision provider (Groq by default)."""
    if not VISION_API_KEY:
        raise RuntimeError("VISION_API_KEY not configured")
    payload = {
        "model": VISION_MODEL,
        "messages": messages,
        "max_tokens": max_tokens,
        "temperature": temperature,
        "stream": False,
    }
    headers = {
        "Authorization": f"Bearer {VISION_API_KEY}",
        "Content-Type": "application/json",
    }
    url = VISION_BASE_URL.rstrip("/") + "/chat/completions"
    async with httpx.AsyncClient(timeout=60.0) as client:
        r = await client.post(url, json=payload, headers=headers)
        r.raise_for_status()
        data = r.json()
    return data["choices"][0]["message"]["content"]


LABEL_PROMPT = (
    "Tu lis le TABLEAU DES VALEURS NUTRITIONNELLES imprime sur l'emballage d'un produit.\n"
    "Extrais les valeurs POUR 100 g (ou pour 100 ml si c'est une boisson).\n"
    "Regles strictes:\n"
    "- Utilise la colonne 'pour 100 g' / 'per 100 g' / 'لكل 100 غ'. IGNORE la colonne 'par portion'.\n"
    "- Si seul le kJ est donne, convertis: kcal = kJ / 4.184 (arrondi).\n"
    "- Si l'etiquette donne 'sodium' et pas 'sel': sel = sodium x 2.5.\n"
    "- Les etiquettes peuvent etre en francais, arabe ou anglais.\n"
    "- 'traces', 'néant', '< 0,5' => 0. La virgule decimale devient un point.\n"
    "- Valeur absente => null. N'invente AUCUNE valeur.\n"
    "- Lis aussi le nom du produit et la marque s'ils sont visibles sur l'image.\n"
    "- basis = '100ml' si le tableau est pour 100 ml, sinon '100g'.\n"
    "- isDrink = true pour une boisson.\n"
    "Reponds UNIQUEMENT avec ce JSON, sans texte ni markdown:\n"
    "{\n"
    '  "found": true,\n'
    '  "name": "nom ou null", "nameAr": "nom arabe ou null", "brand": "marque ou null",\n'
    '  "isDrink": false, "basis": "100g",\n'
    '  "caloriesPer100g": 0, "proteinPer100g": 0, "carbsPer100g": 0, "sugarPer100g": 0,\n'
    '  "fatPer100g": 0, "fiberPer100g": 0, "saltPer100g": 0,\n'
    '  "warnings": []\n'
    "}\n"
    "Si l'image n'est PAS un tableau nutritionnel lisible: {\"found\": false}."
)

_NUM_KEYS = [
    "caloriesPer100g", "proteinPer100g", "carbsPer100g", "sugarPer100g",
    "fatPer100g", "fiberPer100g", "saltPer100g",
]


def _coerce_num(v, lo: float, hi: float):
    if v is None:
        return None
    try:
        if isinstance(v, str):
            v = v.replace(",", ".").strip()
            if v == "" or v.lower() in ("null", "none", "na", "n/a"):
                return None
        f = float(v)
    except (ValueError, TypeError):
        return None
    if f < lo or f > hi:
        return None
    return round(f, 2)


async def _read_label_structured(img_bytes: bytes, mime: str) -> dict:
    b64 = base64.b64encode(img_bytes).decode()
    messages = [{
        "role": "user",
        "content": [
            {"type": "text", "text": LABEL_PROMPT},
            {"type": "image_url", "image_url": {"url": f"data:{mime};base64,{b64}"}},
        ],
    }]
    raw = await vision_chat(messages, max_tokens=800, temperature=0.0)
    match = re.search(r"\{[\s\S]*\}", raw or "")
    if not match:
        return {"found": False}
    try:
        data = json_lib.loads(match.group())
    except Exception:
        return {"found": False}

    if not data.get("found", True):
        return {"found": False}

    out: dict = {"found": True}
    for k in _NUM_KEYS:
        out[k] = _coerce_num(data.get(k), 0, 900 if k == "caloriesPer100g" else 100)
    for s in ("name", "nameAr", "brand"):
        val = data.get(s)
        out[s] = val.strip() if isinstance(val, str) and val.strip() and val.strip().lower() != "null" else None
    out["isDrink"] = bool(data.get("isDrink"))
    out["basis"] = "100ml" if str(data.get("basis", "")).replace(" ", "") == "100ml" else "100g"
    w = data.get("warnings")
    out["warnings"] = [str(x) for x in w][:5] if isinstance(w, list) else []
    return out


class ReadLabelRequest(BaseModel):
    imageBase64: str
    mimeType: Optional[str] = "image/jpeg"


@app.post("/ai/read-label")
async def read_label(request: ReadLabelRequest):
    """Read a nutrition-facts label into structured per-100g values."""
    if not VISION_API_KEY:
        raise HTTPException(status_code=503, detail="vision provider not configured")
    try:
        img = base64.b64decode(request.imageBase64)
    except Exception:
        raise HTTPException(status_code=400, detail="invalid image data")
    try:
        return await _read_label_structured(img, request.mimeType or "image/jpeg")
    except httpx.HTTPStatusError as e:
        body = e.response.text[:300]
        logger.error(f"read-label upstream {e.response.status_code}: {body}")
        raise HTTPException(status_code=502, detail=f"vision upstream {e.response.status_code}")
    except Exception as e:
        logger.error(f"read-label failed: {e}")
        raise HTTPException(status_code=500, detail="label read failed")


@app.get("/ai/vision-models")
async def vision_models():
    """List models the configured vision provider offers (to pick VISION_MODEL)."""
    if not VISION_API_KEY:
        raise HTTPException(status_code=503, detail="vision provider not configured")
    url = VISION_BASE_URL.rstrip("/") + "/models"
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            r = await client.get(url, headers={"Authorization": f"Bearer {VISION_API_KEY}"})
            r.raise_for_status()
            return r.json()
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=502, detail=f"upstream {e.response.status_code}")
