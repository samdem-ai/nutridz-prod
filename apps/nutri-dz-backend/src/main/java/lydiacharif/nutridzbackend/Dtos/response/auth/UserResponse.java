package lydiacharif.nutridzbackend.Dtos.response.auth;

import lombok.*;
import lydiacharif.nutridzbackend.Enums.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserResponse {
    private Long id;
    private String username;
    private String email;
    private Role role;
    private Gender gender;
    private LocalDate birthDate;
    private Float heightCm;
    private Float weightKg;
    private ActivityLevel activityLevel;
    private WorkType workType;
    private WorkoutType workoutType;
    private DiabetesType diabetesType;
    private String allergies;
    private NutritionGoal nutritionGoal;
    private Float dailyCalorieTarget;
    private Float dailyProteinTarget;
    private Float dailyCarbTarget;
    private Float dailyFatTarget;
    private Float dailyWaterTargetMl;
    private String avatarUrl;
    private LocalDateTime createdAt;
}