package lydiacharif.nutridzbackend.Dtos.response.food;

import lombok.*;
import lydiacharif.nutridzbackend.Enums.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DailyJournalResponse {

    private LocalDate date;
    private Float totalCalories;
    private Float totalProtein;
    private Float totalCarbs;
    private Float totalFat;
    private Float waterMl;
    private Float targetCalories;
    private Float targetProtein;
    private Float targetCarbs;
    private Float targetFat;
    private Float targetWaterMl;
    private Float caloriesProgress;
    private Float proteinProgress;
    private Float carbsProgress;
    private Float fatProgress;
    private Float waterProgress;

    private Map<MealType, List<JournalEntryResponse>> meals;
}