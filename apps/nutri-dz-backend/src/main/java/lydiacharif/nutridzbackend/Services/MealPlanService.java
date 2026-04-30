package lydiacharif.nutridzbackend.Services;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import lydiacharif.nutridzbackend.Dtos.request.mealplan.GeneratePlanRequest;
import lydiacharif.nutridzbackend.Dtos.response.mealplan.MealPlanResponse;
import lydiacharif.nutridzbackend.Enums.FoodCategory;
import lydiacharif.nutridzbackend.Enums.MealType;
import lydiacharif.nutridzbackend.Enums.RecipeCategory;
import lydiacharif.nutridzbackend.Exceptions.ResourceNotFoundException;
import lydiacharif.nutridzbackend.Exceptions.UnauthorizedActionException;
import lydiacharif.nutridzbackend.Models.*;
import lydiacharif.nutridzbackend.Repositories.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class MealPlanService {

    private final MealPlanRepository mealPlanRepository;
    private final RecipeRepository recipeRepository;
    private final FoodRepository foodRepository;
    private final UserRepository userRepository;

    @Transactional
    public MealPlanResponse generate(Long userId, GeneratePlanRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        int days = request.getDays();
        boolean preferAlgerian = Boolean.TRUE.equals(request.getPreferAlgerian());

        List<Recipe> algerianLunches = recipeRepository.findByCategory(RecipeCategory.ALGERIAN, 50, 0);
        List<Recipe> healthyRecipes  = recipeRepository.findByCategory(RecipeCategory.HEALTHY, 50, 0);
        List<Recipe> allPublic       = recipeRepository.findPublic(100, 0);

        List<Food> breakfastFoods = foodRepository.findByCategory(FoodCategory.INGREDIENT)
                .stream().limit(20).toList();
        List<Food> snackFoods = foodRepository.findByCategory(FoodCategory.HEALTHY_RECIPE)
                .stream().limit(20).toList();

        LocalDate startDate = LocalDate.now();
        LocalDate endDate   = startDate.plusDays(days - 1);

        MealPlan plan = MealPlan.builder()
                .userId(userId)
                .startDate(startDate)
                .endDate(endDate)
                .durationDays(days)
                .build();

        MealPlan saved = mealPlanRepository.save(plan);

        Map<Long, Float> shoppingMap = new LinkedHashMap<>();
        List<MealPlanItem> allItems  = new ArrayList<>();

        for (int d = 0; d < days; d++) {
            LocalDate date = startDate.plusDays(d);

            if (!breakfastFoods.isEmpty()) {
                Food breakfast = breakfastFoods.get(d % breakfastFoods.size());
                float qty = 150f;
                MealPlanItem item = MealPlanItem.builder()
                        .mealPlanId(saved.getId())
                        .date(date)
                        .mealType(MealType.BREAKFAST)
                        .foodId(breakfast.getId())
                        .quantityGrams(qty)
                        .calories(breakfast.getCaloriesPer100g() != null
                                ? breakfast.getCaloriesPer100g() * (qty / 100f) : 0f)
                        .build();
                mealPlanRepository.saveItem(item);
                allItems.add(item);
                shoppingMap.merge(breakfast.getId(), qty, Float::sum);
            }

            Recipe lunch = pickRecipe(d, preferAlgerian ? algerianLunches : allPublic, allPublic);
            if (lunch != null) {
                float qty = 300f;
                MealPlanItem item = MealPlanItem.builder()
                        .mealPlanId(saved.getId())
                        .date(date)
                        .mealType(MealType.LUNCH)
                        .recipeId(lunch.getId())
                        .quantityGrams(qty)
                        .calories(orZero(lunch.getCaloriesPerServing()))
                        .build();
                mealPlanRepository.saveItem(item);
                allItems.add(item);
                addRecipeIngredientsToShopping(lunch.getId(), shoppingMap);
            }

            List<Recipe> dinnerPool = (d % 2 == 0) ? algerianLunches : healthyRecipes;
            Recipe dinner = pickRecipe(d + 1, dinnerPool.isEmpty() ? allPublic : dinnerPool, allPublic);
            if (dinner != null) {
                float qty = 300f;
                MealPlanItem item = MealPlanItem.builder()
                        .mealPlanId(saved.getId())
                        .date(date)
                        .mealType(MealType.DINNER)
                        .recipeId(dinner.getId())
                        .quantityGrams(qty)
                        .calories(orZero(dinner.getCaloriesPerServing()))
                        .build();
                mealPlanRepository.saveItem(item);
                allItems.add(item);
                addRecipeIngredientsToShopping(dinner.getId(), shoppingMap);
            }

            if (!snackFoods.isEmpty()) {
                Food snack = snackFoods.get(d % snackFoods.size());
                float qty = 100f;
                MealPlanItem item = MealPlanItem.builder()
                        .mealPlanId(saved.getId())
                        .date(date)
                        .mealType(MealType.SNACK)
                        .foodId(snack.getId())
                        .quantityGrams(qty)
                        .calories(snack.getCaloriesPer100g() != null
                                ? snack.getCaloriesPer100g() * (qty / 100f) : 0f)
                        .build();
                mealPlanRepository.saveItem(item);
                allItems.add(item);
                shoppingMap.merge(snack.getId(), qty, Float::sum);
            }
        }

        List<ShoppingListItem> shoppingItems = new ArrayList<>();
        for (Map.Entry<Long, Float> entry : shoppingMap.entrySet()) {
            ShoppingListItem si = ShoppingListItem.builder()
                    .mealPlanId(saved.getId())
                    .foodId(entry.getKey())
                    .quantityGrams(entry.getValue())
                    .checked(false)
                    .build();
            shoppingItems.add(mealPlanRepository.saveShoppingItem(si));
        }

        log.info("Meal plan generated id={} for user={} ({} days, algerian={})",
                saved.getId(), userId, days, preferAlgerian);

        return buildResponse(saved, allItems, shoppingItems);
    }

    public MealPlanResponse getById(Long userId, Long planId) {
        MealPlan plan = mealPlanRepository.findById(planId)
                .orElseThrow(() -> new ResourceNotFoundException("MealPlan", planId));

        if (!plan.getUserId().equals(userId))
            throw new UnauthorizedActionException("access this meal plan");

        List<MealPlanItem>    items = mealPlanRepository.findItemsByPlanId(planId);
        List<ShoppingListItem> shop = mealPlanRepository.findShoppingItemsByPlanId(planId);
        return buildResponse(plan, items, shop);
    }

    public List<MealPlanResponse> getMyPlans(Long userId) {
        return mealPlanRepository.findByUserId(userId).stream()
                .map(plan -> {
                    List<MealPlanItem>    items = mealPlanRepository.findItemsByPlanId(plan.getId());
                    List<ShoppingListItem> shop = mealPlanRepository.findShoppingItemsByPlanId(plan.getId());
                    return buildResponse(plan, items, shop);
                })
                .collect(Collectors.toList());
    }

    @Transactional
    public void toggleShoppingItem(Long userId, Long planId, Long itemId) {
        MealPlan plan = mealPlanRepository.findById(planId)
                .orElseThrow(() -> new ResourceNotFoundException("MealPlan", planId));
        if (!plan.getUserId().equals(userId))
            throw new UnauthorizedActionException("modify this shopping list");

        ShoppingListItem item = mealPlanRepository.findShoppingItemById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("ShoppingListItem", itemId));
        item.setChecked(!item.getChecked());
        mealPlanRepository.saveShoppingItem(item);
    }

    @Transactional
    public void deletePlan(Long userId, Long planId) {
        MealPlan plan = mealPlanRepository.findById(planId)
                .orElseThrow(() -> new ResourceNotFoundException("MealPlan", planId));
        if (!plan.getUserId().equals(userId))
            throw new UnauthorizedActionException("delete this meal plan");
        mealPlanRepository.deleteById(planId);
        log.info("Plan deleted id={} by user={}", planId, userId);
    }


    private Recipe pickRecipe(int index, List<Recipe> preferred, List<Recipe> fallback) {
        if (!preferred.isEmpty()) return preferred.get(index % preferred.size());
        if (!fallback.isEmpty())  return fallback.get(index % fallback.size());
        return null;
    }

    private void addRecipeIngredientsToShopping(Long recipeId, Map<Long, Float> map) {
        recipeRepository.findIngredientsByRecipeId(recipeId)
                .forEach(ing -> map.merge(ing.getFoodId(), ing.getQuantityGrams(), Float::sum));
    }

    private float orZero(Float val) { return val != null ? val : 0f; }

    private MealPlanResponse buildResponse(MealPlan plan,
                                           List<MealPlanItem> items,
                                           List<ShoppingListItem> shoppingItems) {
        Map<LocalDate, Map<MealType, List<MealPlanResponse.PlanItemResponse>>> grouped = new LinkedHashMap<>();

        for (MealPlanItem item : items) {
            grouped.computeIfAbsent(item.getDate(), k -> new LinkedHashMap<>())
                    .computeIfAbsent(item.getMealType(), k -> new ArrayList<>())
                    .add(buildItemResponse(item));
        }

        List<MealPlanResponse.DayPlan> dayPlans = new ArrayList<>();
        for (Map.Entry<LocalDate, Map<MealType, List<MealPlanResponse.PlanItemResponse>>> entry : grouped.entrySet()) {
            float dayCal = 0, dayProt = 0, dayCarb = 0, dayFat = 0;
            for (MealPlanItem item : items) {
                if (!item.getDate().equals(entry.getKey())) continue;
                dayCal += orZero(item.getCalories());
                if (item.getFoodId() != null) {
                    Food f = foodRepository.findById(item.getFoodId()).orElse(null);
                    if (f != null) {
                        float ratio = orZero(item.getQuantityGrams()) / 100f;
                        dayProt += orZero(f.getProteinPer100g()) * ratio;
                        dayCarb += orZero(f.getCarbsPer100g())   * ratio;
                        dayFat  += orZero(f.getFatPer100g())     * ratio;
                    }
                } else if (item.getRecipeId() != null) {
                    Recipe r = recipeRepository.findById(item.getRecipeId()).orElse(null);
                    if (r != null) {
                        dayProt += orZero(r.getProteinPerServing());
                        dayCarb += orZero(r.getCarbsPerServing());
                        dayFat  += orZero(r.getFatPerServing());
                    }
                }
            }
            dayPlans.add(MealPlanResponse.DayPlan.builder()
                    .date(entry.getKey())
                    .totalCalories(dayCal)
                    .totalProtein(dayProt)
                    .totalCarbs(dayCarb)
                    .totalFat(dayFat)
                    .meals(entry.getValue())
                    .build());
        }

        List<MealPlanResponse.ShoppingItemResponse> shopResponse = shoppingItems.stream()
                .map(si -> {
                    Food food = foodRepository.findById(si.getFoodId()).orElse(null);
                    return MealPlanResponse.ShoppingItemResponse.builder()
                            .id(si.getId())
                            .foodId(si.getFoodId())
                            .foodName(food != null ? food.getName() : null)
                            .foodNameAr(food != null ? food.getNameAr() : null)
                            .quantityGrams(si.getQuantityGrams())
                            .checked(si.getChecked())
                            .build();
                })
                .collect(Collectors.toList());

        return MealPlanResponse.builder()
                .id(plan.getId())
                .startDate(plan.getStartDate())
                .endDate(plan.getEndDate())
                .durationDays(plan.getDurationDays())
                .generatedAt(plan.getGeneratedAt())
                .days(dayPlans)
                .shoppingList(shopResponse)
                .build();
    }

    private MealPlanResponse.PlanItemResponse buildItemResponse(MealPlanItem item) {
        if (item.getRecipeId() != null) {
            Recipe r = recipeRepository.findById(item.getRecipeId()).orElse(null);
            return MealPlanResponse.PlanItemResponse.builder()
                    .id(item.getId())
                    .recipeId(item.getRecipeId())
                    .recipeName(r != null ? r.getTitle() : null)
                    .recipeImageUrl(r != null ? r.getImageUrl() : null)
                    .calories(item.getCalories())
                    .isAlgerian(r != null && Boolean.TRUE.equals(r.getIsAlgerian()))
                    .build();
        } else {
            Food f = item.getFoodId() != null
                    ? foodRepository.findById(item.getFoodId()).orElse(null) : null;
            return MealPlanResponse.PlanItemResponse.builder()
                    .id(item.getId())
                    .foodId(item.getFoodId())
                    .foodName(f != null ? f.getName() : null)
                    .quantityGrams(item.getQuantityGrams())
                    .calories(item.getCalories())
                    .isAlgerian(false)
                    .build();
        }
    }
}