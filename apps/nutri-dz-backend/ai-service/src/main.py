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

NVIDIA_API_KEY = os.getenv("NVIDIA_API_KEY", "")
NVIDIA_MODEL = os.getenv("NVIDIA_MODEL", "mistralai/ministral-14b-instruct-2512")
NVIDIA_VISION_MODEL = os.getenv("NVIDIA_VISION_MODEL", "meta/llama-3.2-11b-vision-instruct")
NVIDIA_URL = "https://integrate.api.nvidia.com/v1/chat/completions"

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


async def nvidia_chat(
    messages: List[dict],
    *,
    max_tokens: int = 1024,
    temperature: float = 0.4,
    model: Optional[str] = None,
) -> str:
    """Call NVIDIA NIM chat-completions endpoint (OpenAI-compatible)."""
    if not NVIDIA_API_KEY:
        raise RuntimeError("NVIDIA_API_KEY not configured")

    payload = {
        "model": model or NVIDIA_MODEL,
        "messages": messages,
        "max_tokens": max_tokens,
        "temperature": temperature,
        "top_p": 1.0,
        "frequency_penalty": 0.0,
        "presence_penalty": 0.0,
        "stream": False,
    }
    headers = {
        "Authorization": f"Bearer {NVIDIA_API_KEY}",
        "Accept": "application/json",
        "Content-Type": "application/json",
    }
    async with httpx.AsyncClient(timeout=60.0) as client:
        r = await client.post(NVIDIA_URL, json=payload, headers=headers)
        r.raise_for_status()
        data = r.json()
    return data["choices"][0]["message"]["content"]


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
    return {"status": "ok", "service": "nutridz-ai", "provider": "nvidia", "model": NVIDIA_MODEL}


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
        "Identifie le ou les aliments/boissons dans cette photo.\n\n"
        "Reponds UNIQUEMENT avec ce JSON (pas de markdown, pas de texte):\n"
        "{\n"
        '  "detectedFoods": [\n'
        '    {\n'
        '      "name": "Nom du plat en francais",\n'
        '      "nameAr": "Nom en arabe (si applicable, sinon null)",\n'
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
        "Si la photo ne montre aucun aliment ni boisson (personne, paysage, objet inerte), retourne {\"detectedFoods\": [], \"advice\": \"Pas d'aliment visible. Prends une photo de ton plat.\"}.\n\n"
        f"Profil utilisateur:\n{profile}\n\n"
        "Reconnais les plats algeriens (couscous, chorba, chakchouka, mhajeb, tajine, bourek, dolma, hrira, etc.). "
        "Pour l'eau et boissons: utilise 0 calorie si c'est de l'eau. "
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
    raw = await nvidia_chat(messages, max_tokens=1024, temperature=0.1, model=NVIDIA_VISION_MODEL)
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


# JSON variant — base64 in body
class ImageAnalysisRequest(BaseModel):
    imageBase64: str
    mimeType: Optional[str] = "image/jpeg"
    userContext: Optional[UserContext] = None


@app.post("/ai/analyze-food-image")
async def analyze_food_image_json(request: ImageAnalysisRequest):
    try:
        img_bytes = base64.b64decode(request.imageBase64)
        result = await _analyze_image_structured(
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
        result = await _analyze_image_structured(img_bytes, mime, None)
        return result
    except Exception as e:
        logger.error(f"Image analysis error: {e}")
        return {"detectedFoods": [], "advice": "Analyse non disponible. Reessaye avec une photo plus claire.", "error": str(e)}
