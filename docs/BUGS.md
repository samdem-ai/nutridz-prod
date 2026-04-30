# Known Bugs / Backlog

Tracking issues to fix in future iterations.

---

## [BUG-001] Camera-added food: calorie total increases but journal entries don't appear

**Severity:** High
**Reported:** session 2026-04-30
**Status:** Open

### Symptoms
After adding a food from the AI photo scan flow:
- Dashboard calorie ring updates (totals refresh correctly)
- Journal screen meal sections (Breakfast/Lunch/Dinner/Snack) stay empty — the entry is not visible in the daily list

### Suspected cause
The `meal_logs` table aggregate updates correctly (used by `DailyJournalResponse.totalCalories`), but the `journal_entries` query that populates `meals` map in the response may be missing the new entry due to:
- Caching at React Query level even after `invalidateQueries(['journal'])`
- `JournalEntryRepository.findByUserAndDate` not returning the freshly-inserted row in the same transaction context
- AI-detected food's `foodId` being set in `journal_entries` but its `foodName` resolution in `mapToEntryResponse` returning null, so the entry is technically there but rendered as empty

### Reproduction
1. Open camera tab, take photo of a food
2. Wait for AI detection
3. Tap a detected food → AddFoodModal → Confirm
4. Check journal — totals updated, but meal section empty

### Investigation TODO
- [ ] Add backend log in `FoodService.logFood` confirming `journal_entries` row insert + foodName lookup
- [ ] Verify `getDailyJournal` returns the new entry in the `meals` map for the same date
- [ ] Check React Query devtools to confirm cache invalidation triggers refetch
- [ ] Check whether AI-resolved food's `Food.name` field is properly set when auto-creating new `AI_DETECTED` entries
- [ ] Test if directly logging via `POST /api/journal` (curl) shows in `GET /journal/daily` immediately

### Workaround
Pull-to-refresh the journal screen, or kill+reopen the app.

---

## [BUG-002] Negative calorie remaining with floating-point precision artifact

**Severity:** Medium (cosmetic)
**Reported:** session 2026-04-30
**Status:** Open

### Symptoms
When user exceeds calorie target, the "Remaining" stat or insight banner shows values like:
```
-674.0000000000001 kcal
```

### Cause
Float subtraction in JS / Java accumulates IEEE 754 rounding errors. Source likely:
- `caloriesCible - caloriesConsumed` in `app/(tabs)/index.tsx`
- Or backend `targetCalories - totalCalories` in `DailyJournalResponse`

### Fix plan
1. Round all displayed kcal/macro values to integer or 1 decimal at render time:
   ```ts
   Math.round(caloriesCible - caloriesConsumed)
   ```
2. Apply same in:
   - Dashboard insight banner (`home.insightOver`)
   - Calorie ring "Remaining" stat
   - Macro bars
   - Journal summary card

### Affected files
- `apps/mobile/app/(tabs)/index.tsx` — `remaining`, `getDailyInsight()`
- `apps/mobile/app/(tabs)/journal.tsx` — summary
- `apps/mobile/src/components/ui/CalorieRing.tsx`
- `apps/mobile/src/components/ui/MacroBar.tsx`

### Quick fix
Wrap subtractions in `Math.round()`:
```diff
- const remaining = Math.max(0, caloriesCible - caloriesConsumed);
+ const remaining = Math.max(0, Math.round(caloriesCible - caloriesConsumed));
```

Note: also remove `Math.max(0, ...)` if user wants to *see* negative values when goal exceeded — currently we clamp to 0. Either way, integer-round.

---

## How to add a new bug

1. New `## [BUG-NNN]` section
2. Include: severity, status, symptoms, suspected cause, reproduction steps, investigation TODO, workaround
3. Reference affected file paths so future fix is fast
