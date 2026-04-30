package lydiacharif.nutridzbackend.Dtos.request.auth;

import jakarta.validation.constraints.*;
import lombok.*;
import lydiacharif.nutridzbackend.Enums.*;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateProfileRequest {

    @Size(min = 3, max = 50)
    private String username;

    private Gender gender;
    private LocalDate birthDate;

    @Positive(message = "Height must be positive")
    private Float heightCm;

    @Positive(message = "Weight must be positive")
    private Float weightKg;

    private ActivityLevel activityLevel;
    private WorkType workType;
    private WorkoutType workoutType;
    private DiabetesType diabetesType;
    private String allergies;
    private NutritionGoal nutritionGoal;

    @Positive private Float dailyCalorieTarget;
    @Positive private Float dailyProteinTarget;
    @Positive private Float dailyCarbTarget;
    @Positive private Float dailyFatTarget;
    @Positive private Float dailyWaterTargetMl;
    private String avatarUrl;
}