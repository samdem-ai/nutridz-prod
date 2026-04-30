# NutriDz

AI-powered Algerian nutrition tracking app — Spring Boot backend + Python AI microservice + Expo (React Native) mobile.

## What it does

- 📷 **AI photo scan** — point at a meal, get the dish identified (with Algerian dishes recognized) plus calories, macros, and a NutriScore
- 📊 **Barcode scanner** — scan packaged products against a 184-product Algerian database
- 🍽️ **Daily journal** — log meals by type (breakfast/lunch/dinner/snack), track macros, see weekly history
- 💧 **Hydration tracking** — quick water logging with 6 preset cup/bottle sizes
- ⚖️ **Weight & BMI** — log weight, see line chart over 7d / 30d / 3m / all, motivational status messages
- 🤖 **AI nutritionist chat** — multilingual (FR · AR · EN) Q&A backed by NVIDIA NIM, with markdown rendering and quick-start prompts
- 📅 **Meal plan generator** — 3 / 5 / 7-day personalized plan with vegetarian / low-carb / Algerian-cuisine toggles
- 🏆 **Streaks & 20 achievements** — daily activity tracking with auto-unlock based on real user actions
- 👥 **Community** — publish recipes, like / comment / save / report, browse a feed of 8 seeded Algerian classics
- 📚 **Algerian dish library** — 15 traditional dishes with photos, regional origin (Constantine / Oran / Alger / Kabylie / Sahara), nutrition, history
- 🎯 **Custom targets** — calorie / macro / water goal customization with 4 macro presets (balanced / low-carb / high-protein / keto)
- 🔔 **Smart notifications** — meal reminders, hydration nudges, streak reminder
- 🌍 **3 languages** — French, English, Arabic (with proper RTL flip)

## Stack

| Layer | Tech |
|-------|------|
| Mobile | Expo SDK 54 · React Native · TypeScript · expo-router · TanStack Query · Zustand · i18next |
| Backend | Spring Boot 3.4 · Java 17 · jOOQ · MySQL 8 · Flyway · JWT · RabbitMQ |
| AI service | FastAPI · Python 3.11 · NVIDIA NIM (vision + text models) |
| Infra | Docker Compose · Maven |

## Repository layout

```
.
├── apps/
│   ├── mobile/              # Expo React Native app
│   │   ├── app/             # expo-router screens
│   │   ├── src/
│   │   │   ├── components/  # UI primitives
│   │   │   ├── hooks/       # React Query hooks
│   │   │   ├── services/    # axios API client, notifications
│   │   │   ├── store/       # Zustand stores (auth, settings)
│   │   │   └── i18n/        # fr / en / ar translation files
│   │   └── package.json
│   └── nutri-dz-backend/    # Spring Boot + Python AI service
│       ├── src/main/java/   # Controllers, Services, Repositories, Models
│       ├── src/main/resources/
│       │   ├── application.properties
│       │   └── db/migration/   # Flyway V1–V7
│       ├── ai-service/       # FastAPI microservice (NVIDIA NIM)
│       └── compose.yml       # MySQL + RabbitMQ + AI + backend
├── database/                 # Standalone SQL seeds
├── docs/                     # Architecture & API docs
└── README.md
```

## Getting started

### Prerequisites

- Docker Desktop
- Node 20+ and npm
- An NVIDIA NIM API key (free tier works) → https://build.nvidia.com/

### 1. Backend (one-shot)

```bash
cd apps/nutri-dz-backend
cp ai-service/.env.example ai-service/.env
# edit ai-service/.env and add your NVIDIA_API_KEY
docker compose up -d
```

Spins up:
- MySQL on `:3306`
- RabbitMQ on `:5672` (management UI on `:15672`)
- AI service on `:8000`
- Spring Boot API on `:8080`

Flyway runs automatically: V1 schema · V2 184 Algerian foods · V3 8 seed recipes · V4 moderation · V5 streaks/achievements · V6/V7 avatar.

Verify:
```bash
curl http://localhost:8080/api/foods/search?q=couscous
```

### 2. Mobile

```bash
cd apps/mobile
npm install
# Edit src/services/api.ts and set API_BASE_URL to your machine's LAN IP
npx expo start --lan
```

Scan the QR code with Expo Go on your phone. Phone must be on the same Wi-Fi.

## Configuration

All sensitive config goes in env vars / `.env` files (gitignored).

| Variable | Purpose | Required |
|----------|---------|----------|
| `NVIDIA_API_KEY` | AI service auth (NVIDIA NIM) | yes for AI features |
| `NVIDIA_VISION_MODEL` | Vision model id | default: `meta/llama-3.2-90b-vision-instruct` |
| `NVIDIA_MODEL` | Text model id | default: `mistralai/ministral-14b-instruct-2512` |
| `JWT_SECRET` | Backend JWT signing key | yes (set in production) |
| `SPRING_DATASOURCE_USERNAME/PASSWORD` | MySQL creds | docker compose handles |

See `apps/nutri-dz-backend/ai-service/.env.example` for the full template.

## Tests

```bash
# Backend unit tests (no DB needed — uses Mockito)
cd apps/nutri-dz-backend
./mvnw test
```

11 tests cover food logging math, BMR calculation, gamification triggers, validation.

```bash
# Mobile type-check
cd apps/mobile
npx tsc --noEmit
```

## API

OpenAPI / Swagger UI is exposed by Spring Boot:

```
http://localhost:8080/swagger-ui.html
```

Endpoints grouped by feature:
- `/api/auth/*` — register, login, profile
- `/api/foods/*` — search, barcode lookup, by category
- `/api/journal/*` — log food, daily summary, delete entry
- `/api/goals/*` — weight log + history, hydration
- `/api/recipes/*` — feed, create, like, save, comment, report
- `/api/meal-plans/*` — AI generation
- `/api/ai/*` — analyze image, analyze meal text, suggest improvements
- `/api/chat/*` — AI nutritionist chat
- `/api/gamification/*` — streak + achievements

Full schema details in `docs/API.md`.

## Documentation

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — system overview, data flow, deployment
- [`docs/API.md`](docs/API.md) — endpoint reference with request / response shapes
- [`docs/MOBILE.md`](docs/MOBILE.md) — mobile app structure, screens, hooks
- [`docs/AI.md`](docs/AI.md) — AI service prompts, models, vision pipeline

## Security notes

- All API keys must be supplied via environment variables — never committed
- `.gitignore` excludes `.env` files; `.env.example` provides templates
- JWT secret must be rotated for production deployment
- Avatars stored as base64 data URIs in `MEDIUMTEXT` column (16 MB max)
- User-reported recipes auto-hidden after 3 reports

## License

Proprietary — see invoice / contract terms.
