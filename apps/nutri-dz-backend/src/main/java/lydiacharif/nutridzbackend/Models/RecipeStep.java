package lydiacharif.nutridzbackend.Models;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RecipeStep {
    private Long id;
    private Long recipeId;
    private Integer stepNumber;
    private String description;
}