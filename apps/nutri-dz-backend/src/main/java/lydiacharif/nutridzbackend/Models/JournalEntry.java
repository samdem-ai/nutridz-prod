package lydiacharif.nutridzbackend.Models;

import lombok.*;
import lydiacharif.nutridzbackend.Enums.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JournalEntry {
    private Long id;
    private Long userId;
    private LocalDate date;
    private MealType mealType;
    private Long foodId;
    private Long recipeId;
    private Float quantityGrams;
    private Float caloriesConsumed;
    private Float proteinConsumed;
    private Float carbsConsumed;
    private Float fatConsumed;
    private LogSource logSource;
    private LocalDateTime loggedAt;
}