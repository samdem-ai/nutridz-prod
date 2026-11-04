# API Reference

Base URL (dev): `http://localhost:8080/api`
Auth: JWT bearer in `Authorization: Bearer <token>` header (all endpoints except register/login).

Swagger UI: `http://localhost:8080/swagger-ui.html`

---

## Auth — `/api/auth`

### `POST /register`
```json
{ "username": "john", "email": "j@x.com", "password": "Pass1234" }
```
→ `{ token, tokenType, userId, username, email, expiresIn }`

### `POST /login`
```json
{ "email": "j@x.com", "password": "Pass1234" }
```
→ same shape as register

### `GET /me`
→ Full `UserResponse` (id, username, email, gender, heightCm, weightKg, activityLevel, allergies, daily*Target, avatarUrl…)

### `PUT /me`
Body: any subset of profile fields. Auto-recomputes calorie/protein/carb/fat/water targets if profile is complete and no override provided. User-supplied targets win.

---

## Foods — `/api/foods`

| Method | Path | Returns |
|--------|------|---------|
| GET | `/search?q=<query>` | `FoodResponse[]` (LIKE on name + nameAr) |
| GET | `/{id}` | single `FoodResponse` |
| GET | `/barcode/{code}` | single `FoodResponse` |
| GET | `/category/{cat}` | by category enum |

`FoodResponse`: `{ id, name, nameAr, category, source, caloriesPer100g, proteinPer100g, carbsPer100g, fatPer100g, fiberPer100g, sugarPer100g, saltPer100g, nutritionalScore, barcode, imageUrl, verified, servingSizes }`

---

## Journal — `/api/journal`

### `POST /` — log food
```json
{
  "foodId": 12,           // OR recipeId
  "mealType": "LUNCH",    // BREAKFAST | LUNCH | DINNER | SNACK
  "quantityGrams": 150,
  "logSource": "MANUAL_SEARCH",  // MANUAL_SEARCH | BARCODE_SCAN | AI_PHOTO | MEAL_PLAN
  "date": "2026-04-30"
}
```
→ `JournalEntryResponse` with computed calories/protein/carbs/fat. Triggers gamification (streak + count-based achievements).

### `GET /daily?date=YYYY-MM-DD`
→ `DailyJournalResponse`: totals, targets, percent progress, meals grouped by mealType.

### `DELETE /{entryId}`

---

## Goals — `/api/goals`

### Weight
- `POST /weight` → `{ weightKg, date }` returns `WeightLogResponse` with computed BMI
- `GET /weight` → array of all weight logs
- `GET /progress` → `{ currentWeight, startingWeight, currentBmi, weightChange, history }`
- `DELETE /weight/{id}`

### Hydration
- `GET /hydration` → today's `{ totalMl, targetMl, glassCount, progressPercent }`
- `POST /hydration` → `{ mlToAdd: 250 }`

---

## Recipes — `/api/recipes`

| Method | Path | Description |
|--------|------|-------------|
| POST | `/` | Create recipe (auto `is_public: true`) |
| GET | `/{id}` | Full recipe with ingredients/steps/comments + likedByMe/savedByMe flags |
| PUT | `/{id}` | Update (author only) |
| DELETE | `/{id}` | Delete (author only) |
| GET | `/feed?page=0&size=20` | Public feed, ordered by likes desc |
| GET | `/category/{cat}?page=0&size=20` | Filter by `RecipeCategory` |
| GET | `/search?q=<term>` | Search title / titleAr |
| GET | `/my` | Current user's recipes |
| GET | `/saved` | Bookmarked recipes |
| GET | `/liked` | Liked recipes |
| POST | `/{id}/like` | Toggle like |
| POST | `/{id}/save` | Toggle bookmark |
| POST | `/{id}/comments` | `{ content }` |
| DELETE | `/comments/{commentId}` | Author or moderator |
| POST | `/{id}/report` | `{ reason }` — auto-hides at 3 reports |

---

## Meal Plans — `/api/meal-plans`

### `POST /generate`
```json
{
  "days": 7,
  "preferAlgerian": true,
  "vegetarian": false,
  "lowCarb": false
}
```
→ `{ plan: "...markdown text..." }` (proxies to AI service)

### `GET /` — list user's plans
### `GET /{id}` — full plan with items and shopping list
### `DELETE /{id}`
### `PATCH /{id}/shopping/{itemId}/toggle`

---

## AI — `/api/ai`

### `POST /analyze-image` (multipart)
Form field `image` = JPEG file
→ `{ foods: FoodResponse[], advice: "..." }` — backend resolves AI-detected foods to DB rows or auto-creates them

### `POST /analyze-meal`
```json
{ "mealDescription": "couscous au poulet" }
```
→ `{ analysis: "..." }`

### `POST /suggest`
```json
{ "todaysMeals": "café + croissant le matin, salade midi" }
```
→ `{ suggestion: "..." }`

---

## Chat — `/api/chat`

### `POST /`
```json
{ "message": "Quels aliments riches en fer ?" }
```
→ `{ reply: "..." }` — markdown

### `GET /history` — user's chat messages
### `DELETE /history`

---

## Gamification — `/api/gamification`

### `GET /streak`
→ `{ currentStreak, longestStreak, lastLogDate }` — 0 if last log > yesterday

### `GET /achievements`
→ `{ total, unlocked, achievements: [{ id, title, description, icon, category, unlocked, unlockedAt }] }`

20 achievements seeded. Categories: JOURNAL, STREAK, HYDRATION, WEIGHT, AI, CHAT, COMMUNITY, ALGERIAN, PLAN. Auto-unlock on threshold hit.

---

## Error format

All non-2xx responses follow:
```json
{
  "timestamp": "2026-04-30T12:34:56",
  "status": 400,
  "errorCode": "VALIDATION_ERROR",
  "message": "Invalid email or password",
  "path": "/api/auth/login"
}
```

`errorCode` enum: `VALIDATION_ERROR`, `INVALID_REQUEST`, `RESOURCE_NOT_FOUND`, `RESOURCE_ALREADY_EXISTS`, `UNAUTHORIZED`, `FORBIDDEN`, `INTERNAL_ERROR`.


---

## Admin — `/api/admin` (role `ADMIN` only)

Used by the admin website (`apps/admin-web`). Non-admin tokens get `403`.

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/stats` | Totals, pending/approved/rejected counts, per-category counts, contributors |
| GET | `/barcode/{code}` | `{ existingFood, pendingSubmissionId }` — is this code already known? |
| POST | `/submissions` | Submit a scanned product (status `PENDING`) |
| GET | `/submissions?status=&q=&page=&size=` | List (label photo omitted) |
| GET | `/submissions/{id}` | Detail incl. label photo and OCR text |
| PUT | `/submissions/{id}` | Edit a pending submission |
| POST | `/submissions/{id}/approve` | Publish to `foods` (optional body = final edits) |
| POST | `/submissions/{id}/reject` | `{ reason }` |
| POST | `/submissions/{id}/reopen` | Rejected → pending |
| DELETE | `/submissions/{id}` | Delete a pending/rejected submission |
| GET | `/foods?q=&category=&verified=&hasBarcode=&page=&size=` | Browse the app's food database |
| GET / PUT | `/foods/{id}` | Read / edit a food directly |
| PATCH | `/foods/{id}/verified` | `{ verified: true|false }` |

Submission body:
```json
{
  "barcode": "6130123456789", "codeFormat": "EAN_13",
  "name": "Selecto 1L", "nameAr": "سيليكتو", "brand": "Hamoud Boualem",
  "category": "PACKAGED_PRODUCT",
  "caloriesPer100g": 42, "proteinPer100g": 0, "carbsPer100g": 10.6, "sugarPer100g": 10.6,
  "fatPer100g": 0, "fiberPer100g": 0, "saltPer100g": 0.03, "nutritionalScore": "E",
  "servingSizes": [{ "label": "1 bouteille", "grams": 1000 }],
  "productImage": "data:image/jpeg;base64,...", "labelImage": "data:image/jpeg;base64,...",
  "ocrText": "...", "targetFoodId": null
}
```
If the barcode already exists in `foods`, the submission is linked to it (`targetFoodId`) and approval updates that food.

Public: `GET /api/public/food-images/{foodId}` serves approved product photos (no auth).
