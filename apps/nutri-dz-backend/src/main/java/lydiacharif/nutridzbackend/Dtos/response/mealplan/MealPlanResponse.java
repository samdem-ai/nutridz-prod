package lydiacharif.nutridzbackend.Dtos.response.mealplan;

import lombok.*;
import lydiacharif.nutridzbackend.Enums.MealType;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MealPlanResponse {

    private Long id;
    private LocalDate startDate;
    private LocalDate endDate;
    private Integer durationDays;
    private LocalDateTime generatedAt;

    private List<DayPlan> days;

    private List<ShoppingItemResponse> shoppingList;

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class DayPlan {
        private LocalDate date;
        private Float totalCalories;
        private Float totalProtein;
        private Float totalCarbs;
        private Float totalFat;
        private Map<MealType, List<PlanItemResponse>> meals;
    }

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class PlanItemResponse {
        private Long id;
        private Long recipeId;
        private String recipeName;
        private String recipeImageUrl;
        private Long foodId;
        private String foodName;
        private Float quantityGrams;
        private Float calories;
        private Boolean isAlgerian;
    }

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class ShoppingItemResponse {
        private Long id;
        private Long foodId;
        private String foodName;
        private String foodNameAr;
        private Float quantityGrams;
        private Boolean checked;
    }
}