# AI Service

FastAPI microservice that proxies all AI inference to NVIDIA NIM. Runs separately from the Spring Boot backend so models can scale independently.

## Stack

- **FastAPI** + **Uvicorn** (Python 3.11)
- **httpx** for outbound HTTP
- **pydantic** for request validation
- **NVIDIA NIM** API (OpenAI-compatible chat completions)

## Endpoints

| Path | Method | Purpose |
|------|--------|---------|
| `/health` | GET | Liveness probe |
| `/ai/chat` | POST | Free-form Q&A with conversation history |
| `/ai/analyze-meal` | POST | Text description → nutrition breakdown |
| `/ai/analyze-food-image` | POST | Base64 image → structured food JSON |
| `/ai/analyze-image` | POST | Multipart variant of above |
| `/ai/meal-plan` | POST | Generate N-day meal plan |
| `/ai/suggest-improvement` | POST | Suggest what to eat next based on day's meals |

All endpoints accept an optional `userContext` object with goal, calorie target, allergies, diabetes type, weight/height — used to personalize prompts.

## Models

| Use case | Default model | Env override |
|----------|---------------|--------------|
| Text completion (chat, meal plan, suggest, analyze-meal) | `mistralai/ministral-14b-instruct-2512` | `NVIDIA_MODEL` |
| Vision (analyze-image) | `meta/llama-3.2-90b-vision-instruct` | `NVIDIA_VISION_MODEL` |

Other vision options: `meta/llama-3.2-11b-vision-instruct` (smaller / faster), `microsoft/phi-3.5-vision-instruct`.

## Image analysis pipeline

1. Receive image (multipart upload or base64 in JSON body)
2. Build prompt with strict output schema and a "verify it's actually food" rule
3. Call vision model at temperature 0.1 (deterministic JSON)
4. Extract JSON via regex
5. Filter detections with confidence < 0.4
6. Return `{ detectedFoods: [...], advice: "..." }`

The Java backend's `AiController.resolveDetectedFood` then:
- Searches `foods` table for fuzzy matches by name
- Falls back to creating a new `AI_DETECTED` food row if no match
- Returns FoodResponse[] with valid IDs that mobile can pass to `POST /api/journal`

## Prompt engineering

### Vision prompt (excerpt)

```
Identifie le ou les aliments/boissons dans cette photo.

Réponds UNIQUEMENT avec ce JSON (pas de markdown, pas de texte):
{
  "detectedFoods": [
    {
      "name": "...",
      "nameAr": "... (si applicable, sinon null)",
      "confidence": 0.85,
      "caloriesPer100g": 165,
      "proteinPer100g": 12,
      "carbsPer100g": 25,
      "fatPer100g": 5,
      "nutritionalScore": "B",
      "estimatedPortionGrams": 250
    }
  ],
  "advice": "..."
}

Si la photo ne montre aucun aliment ni boisson (personne, paysage,
objet inerte), retourne {"detectedFoods": [], "advice": "..."}.

Reconnais les plats algériens (couscous, chorba, chakchouka,
mhajeb, tajine, bourek, dolma, hrira, etc.).
Pour l'eau et boissons: 0 calorie.
Score: A=très sain, B=sain, C=moyen, D=peu sain, E=mauvais.
REPONDS EN JSON UNIQUEMENT.
```

### Chat system prompt

The AI is told it's a nutrition assistant for Algerian users, can answer in FR / AR / Darija / EN, must remind that it doesn't replace medical advice.

## Error handling

- NVIDIA timeout (60s default) → returns graceful fallback `{ analysis: "Analyse non disponible..." }`
- Invalid JSON from model → caught and returned as empty result
- Missing API key → 500 with explicit log message

The Java AiController wraps all calls in try/catch and returns 200 with empty result rather than failing — keeps mobile UX intact when AI is down.

## Cost optimization

- Vision: only called when user takes a photo (~10kb images compressed to 0.8 quality)
- Text: ~500-1000 tokens per call typical
- 90B vision is heavier than 11B; switch via env var if hitting quota
- Conversation history capped at last N messages (configurable in `nvidia_chat`)

## Local development

```bash
cd apps/nutri-dz-backend/ai-service
cp .env.example .env
# add NVIDIA_API_KEY
pip install -r requirements.txt
uvicorn src.main:app --reload --port 8000
```

Or via Docker Compose: `docker compose up ai-service`.

## Testing

```bash
curl -X POST http://localhost:8000/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "hello"}'
```

```bash
# vision smoke test (image as base64)
curl -X POST http://localhost:8000/ai/analyze-food-image \
  -H "Content-Type: application/json" \
  -d "{\"imageBase64\": \"$(base64 -w0 test.jpg)\"}"
```
