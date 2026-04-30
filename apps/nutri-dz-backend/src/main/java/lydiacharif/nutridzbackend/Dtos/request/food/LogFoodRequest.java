package lydiacharif.nutridzbackend.Dtos.request.food;

import jakarta.validation.constraints.*;
import lombok.*;
import lydiacharif.nutridzbackend.Enums.*;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LogFoodRequest {

    private Long foodId;
    private Long recipeId;

    @NotNull(message = "Meal type is required")
    private MealType mealType;

    @NotNull(message = "Quantity is required")
    @Positive(message = "Quantity must be positive")
    private Float quantityGrams;

    @NotNull(message = "Log source is required")
    private LogSource logSource;

    private LocalDate date;
}