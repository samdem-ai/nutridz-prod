package lydiacharif.nutridzbackend.Dtos.request.recipe;

import jakarta.validation.constraints.*;
import lombok.*;
import lydiacharif.nutridzbackend.Enums.RecipeCategory;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateRecipeRequest {

    @NotBlank(message = "Title is required")
    @Size(max = 200)
    private String title;

    @Size(max = 200)
    private String titleAr;

    @Size(max = 1000)
    private String description;

    private String imageUrl;

    @Positive
    private Integer prepTimeMinutes;

    @Positive
    @Builder.Default
    private Integer servings = 1;

    @NotNull(message = "Category is required")
    private RecipeCategory category;

    @Builder.Default
    private Boolean isAlgerian = false;

    @Builder.Default
    private Boolean isPublic = false;

    @NotEmpty(message = "At least one ingredient is required")
    private List<IngredientRequest> ingredients;

    @NotEmpty(message = "At least one step is required")
    private List<StepRequest> steps;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class IngredientRequest {
        @NotNull
        private Long foodId;
        @NotNull @Positive
        private Float quantityGrams;
        private String label;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class StepRequest {
        @NotNull @Positive
        private Integer stepNumber;
        @NotBlank
        private String description;
    }
}