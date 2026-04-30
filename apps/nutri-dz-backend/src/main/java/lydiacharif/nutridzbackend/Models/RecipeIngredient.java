package lydiacharif.nutridzbackend.Models;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RecipeIngredient {
    private Long id;
    private Long recipeId;
    private Long foodId;
    private Float quantityGrams;
    private String label;
}