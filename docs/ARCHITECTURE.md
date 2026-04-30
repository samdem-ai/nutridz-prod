# Architecture

## High level

```
┌─────────────────┐
│  Expo Mobile    │  React Native / TypeScript
│  (iOS, Android) │  axios → JWT bearer
└────────┬────────┘
         │ HTTPS  /api/*
         ▼
┌─────────────────────────────────────────────┐
│  Spring Boot Backend (port 8080)            │
│  ─────────────────────────────────────────  │
│  Controllers (REST) → Services → jOOQ → DB  │
│                                             │
│  • AuthController       /api/auth           │
│  • FoodController       /api/foods, journal │
│  • GoalsController      /api/goals          │
│  • RecipeController     /api/recipes        │
│  • MealPlanController   /api/meal-plans     │
│  • ChatController       /api/chat           │
│  • AiController         /api/ai             │
│  • GamificationController /api/gamification │
└──────┬───────────────┬────────────────┬─────┘
       │               │                │
       ▼               ▼                ▼
   ┌────────┐    ┌──────────┐   ┌──────────────┐
   │ MySQL  │    │ RabbitMQ │   │  AI service  │
   │ 8.0    │    │ (queues) │   │  (FastAPI)   │
   └────────┘    └──────────┘   └──────┬───────┘
                                       │
                                       ▼
                                ┌─────────────┐
                                │ NVIDIA NIM  │
                                │ vision+text │
                                └─────────────┘
```

## Service responsibilities

### Mobile (`apps/mobile`)
- **expo-router** for file-based routing (`app/` folder)
- **TanStack Query** caches all server state and handles refetch on focus
- **Zustand** holds auth token + language preference (persisted via AsyncStorage + SecureStore)
- **i18next** loads fr/en/ar JSON; switches RTL on language change and reloads via `DevSettings.reload`
- **expo-camera** wraps photo capture (AI scan) and barcode scanning
- **expo-image-picker** handles avatar selection (base64 data URIs)
- **expo-notifications** schedules local meal/water/streak reminders

### Spring Boot backend (`apps/nutri-dz-backend`)
- **jOOQ** typed SQL DSL — repositories are thin wrappers around `DSLContext`
- **Flyway** migrations in `src/main/resources/db/migration` run on startup
- **Spring Security** with custom JWT filter (`JwtUtil` + `CustomUserPrincipal`)
- **Lombok** for entity boilerplate (Models package mirrors DB tables)
- **WebClient** for outgoing calls to AI service
- **Service layer** owns business rules (BMR auto-calculation, gamification triggers, recipe moderation auto-hide)

### AI service (`apps/nutri-dz-backend/ai-service`)
- **FastAPI** with three endpoints: `/ai/chat`, `/ai/analyze-meal`, `/ai/analyze-food-image`, `/ai/meal-plan`, `/ai/suggest-improvement`
- **NVIDIA NIM** API for inference (text + vision models configurable via env)
- Vision endpoint uses base64 image input + structured JSON output (food name, confidence, kcal/macros, score, estimated portion)
- Strict prompt engineering rejects non-food images (people, objects)

### Database
- **MySQL 8** primary store
- 16 tables: users, user_streaks, achievements, user_achievements, foods, food_serving_sizes, journal_entries, meal_logs, hydration_logs, weight_logs, recipes, recipe_ingredients, recipe_steps, recipe_likes, recipe_comments, saved_recipes, meal_plans, meal_plan_items, shopping_list_items, recipe_reports, chat_messages, notifications, user_profiles
- Avatars stored as `MEDIUMTEXT` data URIs (base64-encoded JPEG, 16MB cap)
- Flyway versions V1 → V7

### RabbitMQ
- Reserved for async background jobs (notification dispatch, meal-plan generation queue)
- Currently used for connection health-check; service stubs ready for expansion

## Data flow examples

### AI photo scan
1. User snaps a photo in `app/(tabs)/camera.tsx`
2. Mobile POSTs multipart `image/jpeg` to `/api/ai/analyze-image` with JWT
3. `AiController.analyzeImage` base64-encodes the bytes and POSTs to `ai-service:8000/ai/analyze-food-image` with user nutrition context
4. AI service calls NVIDIA NIM vision model, parses JSON response
5. Java backend: for each detected food, fuzzy-match against `foods` table (`foodRepository.search`) — fall back to creating new `AI_DETECTED` row
6. Returns array of `FoodResponse` with valid IDs + confidence + estimated portion
7. Mobile displays result cards; tap → `AddFoodModal` → `POST /api/journal`

### Streak tracking
- `FoodService.logFood` calls `gamificationService.recordActivity(userId, today)` after every successful log
- Service compares `last_log_date` to today: same day = noop, +1 day = increment streak, gap = reset to 1
- 3/7/30/100-day milestones trigger achievement unlock
- `getStreak` returns 0 if `last_log_date` is older than yesterday (lazy reset on read)

## Deployment

### Local dev
- `docker compose up -d` from `apps/nutri-dz-backend/` brings up MySQL + RabbitMQ + AI service + Spring Boot
- Mobile runs via `npx expo start --lan`

### Production (recommended)
- Backend: containerized (already has Dockerfile), deploy to fly.io / Render / EC2 with managed MySQL (RDS / Aiven)
- AI service: separate container, scale independently
- Mobile: EAS Build for signed APK (Android) and IPA (iOS)
- Set `NVIDIA_API_KEY`, `JWT_SECRET`, MySQL creds via cloud provider's secrets manager

## Migration history

| Version | Description |
|---------|-------------|
| V1 | Schema init (16 tables) |
| V2 | Seed 184 Algerian packaged foods from xlsx |
| V3 | Seed 8 community recipes (Algerian classics) |
| V4 | Recipe reports table + reported_count column |
| V5 | user_streaks + achievements catalog (20 trophies) + user_achievements |
| V6 | users.avatar_url (TEXT) |
| V7 | users.avatar_url → MEDIUMTEXT (base64 capacity) |
