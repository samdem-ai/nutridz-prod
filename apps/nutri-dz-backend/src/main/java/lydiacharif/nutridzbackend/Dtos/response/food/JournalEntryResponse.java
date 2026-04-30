package lydiacharif.nutridzbackend.Dtos.response.food;

import lombok.*;
import lydiacharif.nutridzbackend.Enums.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JournalEntryResponse {
    private Long id;
    private LocalDate date;
    private MealType mealType;
    private Long foodId;
    private String foodName;
    private Long recipeId;
    private String recipeName;
    private Float quantityGrams;
    private Float caloriesConsumed;
    private Float proteinConsumed;
    private Float carbsConsumed;
    private Float fatConsumed;
    private LogSource logSource;
    private LocalDateTime loggedAt;
}