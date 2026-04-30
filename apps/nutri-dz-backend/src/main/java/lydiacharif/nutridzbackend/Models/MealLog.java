package lydiacharif.nutridzbackend.Models;

import lombok.*;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MealLog {
    private Long id;
    private Long userId;
    private LocalDate date;
    private Float totalCalories;
    private Float totalProtein;
    private Float totalCarbs;
    private Float totalFat;
    private Float waterMl;
}