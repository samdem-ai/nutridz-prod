package lydiacharif.nutridzbackend.Models;

import lombok.*;
import lydiacharif.nutridzbackend.Enums.*;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MealPlanItem {
    private Long id;
    private Long mealPlanId;
    private LocalDate date;
    private MealType mealType;
    private Long recipeId;    // nullable — either recipe or food
    private Long foodId;      // nullable — either recipe or food
    private Float quantityGrams;
    private Float calories;
}