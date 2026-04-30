# Mobile App

Expo SDK 54 + React Native + TypeScript. File-based routing via expo-router.

## Folder structure

```
apps/mobile/
├── app/                          # expo-router screens
│   ├── _layout.tsx               # root: providers, stack, AI FAB
│   ├── (auth)/
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   └── profile-setup.tsx     # 3-step wizard (sex, height/weight/activity, goal)
│   ├── (tabs)/
│   │   ├── _layout.tsx           # custom tab bar with elevated camera button
│   │   ├── index.tsx             # Dashboard
│   │   ├── journal.tsx           # Daily log + 7-day picker
│   │   ├── camera.tsx            # AI photo scan
│   │   ├── goals.tsx             # Weight + BMI + chart
│   │   └── community.tsx         # Recipe feed
│   ├── recipe/[id].tsx           # Recipe detail with comments
│   ├── chat.tsx                  # AI chat
│   ├── achievements.tsx          # Trophy gallery
│   ├── algerian-dishes.tsx       # 15 traditional dishes
│   ├── barcode.tsx               # Barcode scanner
│   ├── meal-plan.tsx             # AI meal plan generator
│   ├── create-recipe.tsx         # Recipe form
│   ├── my-profile.tsx            # User profile (avatar + 3 tabs)
│   ├── targets.tsx               # Custom calorie/macro/water goals
│   └── settings.tsx              # Language, notifications, profile shortcuts
├── src/
│   ├── components/ui/
│   │   ├── AddFoodModal.tsx      # serving picker + qty + meal type
│   │   ├── AddWaterModal.tsx     # 6 quick amounts + custom
│   │   ├── AiChatFab.tsx         # global floating chat button (bottom-left)
│   │   ├── CalorieRing.tsx       # animated SVG-style ring
│   │   ├── MacroBar.tsx
│   │   ├── Markdown.tsx          # custom MD renderer (no deps)
│   │   ├── NutriScoreBadge.tsx
│   │   └── WeightChart.tsx       # custom line chart
│   ├── hooks/                    # TanStack Query wrappers
│   │   ├── useAuth.ts
│   │   ├── useJournal.ts
│   │   ├── useFoods.ts
│   │   ├── useGoals.ts
│   │   ├── useHydration.ts
│   │   ├── useCommunity.ts
│   │   └── useGamification.ts
│   ├── services/
│   │   ├── api.ts                # axios instance with JWT interceptor
│   │   └── notifications.ts      # expo-notifications scheduling
│   ├── store/
│   │   ├── authStore.ts          # Zustand: user, token via SecureStore
│   │   └── settingsStore.ts      # language, persisted to AsyncStorage
│   ├── i18n/
│   │   ├── index.ts              # i18next init + RTL handler
│   │   ├── fr.json               # ~250 keys
│   │   ├── en.json
│   │   └── ar.json
│   ├── data/
│   │   └── algerianDishes.ts     # 15 dishes with photos, regions, history
│   └── constants/
│       ├── colors.ts
│       └── theme.ts
├── assets/
└── package.json
```

## Navigation flow

```
Splash (auth check)
   │
   ├── if !authenticated → /(auth)/login → /(auth)/register → /(auth)/profile-setup
   │
   └── if authenticated → /(tabs)/index (Dashboard)
                            ├── tap photo  → /(tabs)/camera
                            ├── tap journal → /(tabs)/journal
                            ├── tap goals  → /(tabs)/goals
                            ├── tap community → /(tabs)/community → /recipe/[id]
                            ├── header avatar → /my-profile
                            ├── header trophy → /achievements
                            ├── header gear → /settings → /targets
                            └── floating AI button → /chat
```

## State management

Three layers:
1. **TanStack Query** — server state (food searches, journal, recipes, etc.) with `useFocusEffect` to refetch on screen focus
2. **Zustand** — UI auth state (`user`, `isAuthenticated`) + settings (`language`)
3. **SecureStore** — JWT token persistence
4. **AsyncStorage** — language pref persistence

## Key design decisions

### Custom tab bar
The middle tab is the camera, rendered with `marginTop: -22` to elevate it. White-bg ring (3px border) for visual separation.

### Floating AI button
Mounted globally in `_layout.tsx`. Auto-hides on routes where another FAB or full-screen UI lives (`/chat`, `/barcode`, `/(tabs)/camera`). Positioned bottom-left to avoid conflict with screen-specific bottom-right FABs (goals "Save weight", community "+ create recipe").

### Markdown renderer
Inline custom component (`Markdown.tsx`) with no dependencies. Supports `**bold**`, `*italic*`, `` `code` ``, `~~strike~~`, headers, bullet lists, numbered lists, fenced code blocks. Used in chat replies and meal-plan output.

### RTL handling
Switching to Arabic calls `I18nManager.forceRTL(true)` then triggers `DevSettings.reload()` so layouts flip immediately. An alert prompts the user before reload.

### Avatars as data URIs
Profile photos compressed to 0.2 quality JPEG, base64-encoded, sent as `data:image/jpeg;base64,...` in `PUT /auth/me`. Backend stores in `MEDIUMTEXT` (16 MB cap). Capped at 2.5 MB encoded on client.

### Notification fallback
On Android Expo Go SDK 53, remote push is removed. Code wraps all `expo-notifications` calls in try/catch + skips scheduling on Android Expo Go. Local scheduled notifications still work on iOS Expo Go and standalone builds.

## i18n keys

Top-level namespaces: `common`, `auth`, `profile`, `tabs`, `home`, `journal`, `camera`, `goals`, `community`, `createRecipe`, `chat`, `mealPlan`, `settings`, `targets`, `achievements`, `algerianDishes`, `water`.

Interpolation supported: `t('home.insightLow', { remaining: 800 })`.

To add a language:
1. Create `src/i18n/<code>.json`
2. Add to `resources` in `src/i18n/index.ts`
3. Add to `LANGUAGES` array in `app/settings.tsx`
4. Add to `RTL_LANGUAGES` array in `i18n/index.ts` if RTL

## Run locally

```bash
cd apps/mobile
npm install
npx expo start --lan
```

Both phone and laptop must be on the same Wi-Fi. Edit `src/services/api.ts` `API_BASE_URL` to your laptop's LAN IP (e.g. `http://192.168.1.x:8080/api`).

## Build APK

```bash
npx eas build --platform android --profile preview
```

Requires `expo-updates` install + `app.json` runtime version configured.
