package lydiacharif.nutridzbackend.Services;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import lydiacharif.nutridzbackend.Dtos.request.food.LogFoodRequest;
import lydiacharif.nutridzbackend.Dtos.response.food.*;
import lydiacharif.nutridzbackend.Enums.FoodCategory;
import lydiacharif.nutridzbackend.Enums.MealType;
import lydiacharif.nutridzbackend.Models.*;
import lydiacharif.nutridzbackend.Repositories.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class FoodService {

    private final FoodRepository foodRepository;
    private final JournalEntryRepository journalEntryRepository;
    private final MealLogRepository mealLogRepository;
    private final UserRepository userRepository;
    private final GamificationService gamificationService;

    public FoodResponse getFoodById(Long foodId) {
        Food food = foodRepository.findById(foodId)
                .orElseThrow(() -> new RuntimeException("Food not found: " + foodId));
        return mapToFoodResponse(food);
    }

    public FoodResponse getFoodByBarcode(String barcode) {
        Food food = foodRepository.findByBarcode(barcode)
                .orElseThrow(() -> new RuntimeException("Food not found for barcode: " + barcode));
        return mapToFoodResponse(food);
    }

    public List<FoodResponse> searchFoods(String query) {
        return foodRepository.search(query)
                .stream()
                .map(this::mapToFoodResponse)
                .collect(Collectors.toList());
    }

    public List<FoodResponse> getFoodsByCategory(FoodCategory category) {
        return foodRepository.findByCategory(category)
                .stream()
                .map(this::mapToFoodResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public JournalEntryResponse logFood(Long userId, LogFoodRequest request) {
        if (request.getFoodId() == null && request.getRecipeId() == null) {
            throw new RuntimeException("Either foodId or recipeId must be provided");
        }
        if (request.getFoodId() != null && request.getRecipeId() != null) {
            throw new RuntimeException("Provide either foodId or recipeId, not both");
        }

        LocalDate date = request.getDate() != null ? request.getDate() : LocalDate.now();

        float calories = 0, protein = 0, carbs = 0, fat = 0;
        String foodName = null;
        String recipeName = null;

        if (request.getFoodId() != null) {
            Food food = foodRepository.findById(request.getFoodId())
                    .orElseThrow(() -> new RuntimeException("Food not found: " + request.getFoodId()));
            float ratio = request.getQuantityGrams() / 100f;
            calories = food.getCaloriesPer100g() != null ? food.getCaloriesPer100g() * ratio : 0;
            protein  = food.getProteinPer100g()  != null ? food.getProteinPer100g()  * ratio : 0;
            carbs    = food.getCarbsPer100g()    != null ? food.getCarbsPer100g()    * ratio : 0;
            fat      = food.getFatPer100g()      != null ? food.getFatPer100g()      * ratio : 0;
            foodName = food.getName();
        }

        JournalEntry entry = JournalEntry.builder()
                .userId(userId)
                .date(date)
                .mealType(request.getMealType())
                .foodId(request.getFoodId())
                .recipeId(request.getRecipeId())
                .quantityGrams(request.getQuantityGrams())
                .caloriesConsumed(calories)
                .proteinConsumed(protein)
                .carbsConsumed(carbs)
                .fatConsumed(fat)
                .logSource(request.getLogSource())
                .build();

        JournalEntry saved = journalEntryRepository.save(entry);
        updateMealLog(userId, date, calories, protein, carbs, fat);

        log.info("Food logged for user {} on {}: {} kcal", userId, date, calories);

        // Gamification triggers
        try {
            gamificationService.recordActivity(userId, date);
            gamificationService.checkCountBased(userId, "JOURNAL");
            if (request.getLogSource() != null) {
                String src = request.getLogSource().name();
                if ("AI_PHOTO".equals(src)) gamificationService.checkCountBased(userId, "AI_PHOTO");
                if ("BARCODE_SCAN".equals(src)) gamificationService.checkCountBased(userId, "BARCODE");
            }
        } catch (Exception e) {
            log.warn("Gamification update failed: {}", e.getMessage());
        }

        return mapToEntryResponse(saved, foodName, recipeName);
    }

    @Transactional
    public void deleteJournalEntry(Long userId, Long entryId) {
        JournalEntry entry = journalEntryRepository.findById(entryId)
                .orElseThrow(() -> new RuntimeException("Entry not found: " + entryId));

        if (!entry.getUserId().equals(userId)) {
            throw new RuntimeException("Not authorized to delete this entry");
        }
        updateMealLog(userId, entry.getDate(),
                -entry.getCaloriesConsumed(),
                -entry.getProteinConsumed(),
                -entry.getCarbsConsumed(),
                -entry.getFatConsumed());

        journalEntryRepository.deleteById(entryId);
    }

    public DailyJournalResponse getDailyJournal(Long userId, LocalDate date) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<JournalEntry> entries = journalEntryRepository.findByUserAndDate(userId, date);
        Optional<MealLog> mealLog = mealLogRepository.findByUserAndDate(userId, date);

        float totalCalories = mealLog.map(MealLog::getTotalCalories).orElse(0f);
        float totalProtein  = mealLog.map(MealLog::getTotalProtein).orElse(0f);
        float totalCarbs    = mealLog.map(MealLog::getTotalCarbs).orElse(0f);
        float totalFat      = mealLog.map(MealLog::getTotalFat).orElse(0f);
        float waterMl       = mealLog.map(MealLog::getWaterMl).orElse(0f);

        float targetCal   = orZero(user.getDailyCalorieTarget());
        float targetProt  = orZero(user.getDailyProteinTarget());
        float targetCarb  = orZero(user.getDailyCarbTarget());
        float targetFat   = orZero(user.getDailyFatTarget());
        float targetWater = orZero(user.getDailyWaterTargetMl());

        Map<MealType, List<JournalEntryResponse>> meals = new EnumMap<>(MealType.class);
        for (MealType type : MealType.values()) {
            List<JournalEntryResponse> mealEntries = entries.stream()
                    .filter(e -> e.getMealType() == type)
                    .map(e -> mapToEntryResponse(e, null, null))
                    .collect(Collectors.toList());
            meals.put(type, mealEntries);
        }

        return DailyJournalResponse.builder()
                .date(date)
                .totalCalories(totalCalories)
                .totalProtein(totalProtein)
                .totalCarbs(totalCarbs)
                .totalFat(totalFat)
                .waterMl(waterMl)
                .targetCalories(targetCal)
                .targetProtein(targetProt)
                .targetCarbs(targetCarb)
                .targetFat(targetFat)
                .targetWaterMl(targetWater)
                .caloriesProgress(targetCal > 0 ? totalCalories / targetCal : 0)
                .proteinProgress(targetProt > 0 ? totalProtein / targetProt : 0)
                .carbsProgress(targetCarb > 0 ? totalCarbs / targetCarb : 0)
                .fatProgress(targetFat > 0 ? totalFat / targetFat : 0)
                .waterProgress(targetWater > 0 ? waterMl / targetWater : 0)
                .meals(meals)
                .build();
    }

    @Transactional
    public void logWater(Long userId, Float mlToAdd) {
        LocalDate today = LocalDate.now();
        MealLog log = mealLogRepository.findByUserAndDate(userId, today)
                .orElse(MealLog.builder()
                        .userId(userId)
                        .date(today)
                        .totalCalories(0f)
                        .totalProtein(0f)
                        .totalCarbs(0f)
                        .totalFat(0f)
                        .waterMl(0f)
                        .build());

        log.setWaterMl(log.getWaterMl() + mlToAdd);
        mealLogRepository.save(log);
    }

    private void updateMealLog(Long userId, LocalDate date,
                               float calories, float protein, float carbs, float fat) {
        MealLog log = mealLogRepository.findByUserAndDate(userId, date)
                .orElse(MealLog.builder()
                        .userId(userId)
                        .date(date)
                        .totalCalories(0f)
                        .totalProtein(0f)
                        .totalCarbs(0f)
                        .totalFat(0f)
                        .waterMl(0f)
                        .build());

        log.setTotalCalories(log.getTotalCalories() + calories);
        log.setTotalProtein(log.getTotalProtein() + protein);
        log.setTotalCarbs(log.getTotalCarbs() + carbs);
        log.setTotalFat(log.getTotalFat() + fat);
        mealLogRepository.save(log);
    }

    private float orZero(Float val) {
        return val != null ? val : 0f;
    }
    
    private FoodResponse mapToFoodResponse(Food food) {
        List<ServingSizeResponse> servingSizes = foodRepository
                .findServingSizesByFoodId(food.getId())
                .stream()
                .map(s -> {
                    float ratio = s.getGrams() / 100f;
                    return ServingSizeResponse.builder()
                            .id(s.getId())
                            .label(s.getLabel())
                            .grams(s.getGrams())
                            .calories(food.getCaloriesPer100g() != null ? food.getCaloriesPer100g() * ratio : null)
                            .protein(food.getProteinPer100g()   != null ? food.getProteinPer100g()   * ratio : null)
                            .carbs(food.getCarbsPer100g()       != null ? food.getCarbsPer100g()       * ratio : null)
                            .fat(food.getFatPer100g()           != null ? food.getFatPer100g()           * ratio : null)
                            .build();
                })
                .collect(Collectors.toList());

        return FoodResponse.builder()
                .id(food.getId())
                .name(food.getName())
                .nameAr(food.getNameAr())
                .category(food.getCategory())
                .source(food.getSource())
                .caloriesPer100g(food.getCaloriesPer100g())
                .proteinPer100g(food.getProteinPer100g())
                .carbsPer100g(food.getCarbsPer100g())
                .fatPer100g(food.getFatPer100g())
                .fiberPer100g(food.getFiberPer100g())
                .sugarPer100g(food.getSugarPer100g())
                .saltPer100g(food.getSaltPer100g())
                .nutritionalScore(food.getNutritionalScore())
                .barcode(food.getBarcode())
                .imageUrl(food.getImageUrl())
                .verified(food.getVerified())
                .servingSizes(servingSizes)
                .build();
    }

    private JournalEntryResponse mapToEntryResponse(JournalEntry entry, String foodName, String recipeName) {
        return JournalEntryResponse.builder()
                .id(entry.getId())
                .date(entry.getDate())
                .mealType(entry.getMealType())
                .foodId(entry.getFoodId())
                .foodName(foodName)
                .recipeId(entry.getRecipeId())
                .recipeName(recipeName)
                .quantityGrams(entry.getQuantityGrams())
                .caloriesConsumed(entry.getCaloriesConsumed())
                .proteinConsumed(entry.getProteinConsumed())
                .carbsConsumed(entry.getCarbsConsumed())
                .fatConsumed(entry.getFatConsumed())
                .logSource(entry.getLogSource())
                .loggedAt(entry.getLoggedAt())
                .build();
    }
}