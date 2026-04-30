package lydiacharif.nutridzbackend.Models;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ShoppingListItem {
    private Long id;
    private Long mealPlanId;
    private Long foodId;
    private Float quantityGrams;
    private Boolean checked;
}