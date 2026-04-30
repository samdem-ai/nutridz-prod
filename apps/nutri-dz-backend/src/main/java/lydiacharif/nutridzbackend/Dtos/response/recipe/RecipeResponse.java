package lydiacharif.nutridzbackend.Dtos.response.recipe;

import lombok.*;
import lydiacharif.nutridzbackend.Enums.RecipeCategory;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RecipeResponse {
    private Long id;
    private Long authorId;
    private String authorUsername;
    private String title;
    private String titleAr;
    private String description;
    private String imageUrl;
    private Integer prepTimeMinutes;
    private Integer servings;
    private Float caloriesPerServing;
    private Float proteinPerServing;
    private Float carbsPerServing;
    private Float fatPerServing;
    private RecipeCategory category;
    private Boolean isAlgerian;
    private Boolean isPublic;
    private Integer likesCount;
    private Boolean likedByMe;
    private Boolean savedByMe;
    private LocalDateTime createdAt;
    private List<IngredientResponse> ingredients;
    private List<StepResponse> steps;
    private List<CommentResponse> comments;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class IngredientResponse {
        private Long id;
        private Long foodId;
        private String foodName;
        private Float quantityGrams;
        private String label;
        private Float calories;
        private Float protein;
        private Float carbs;
        private Float fat;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class StepResponse {
        private Long id;
        private Integer stepNumber;
        private String description;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CommentResponse {
        private Long id;
        private Long userId;
        private String username;
        private String content;
        private LocalDateTime createdAt;
    }
}