package lydiacharif.nutridzbackend.Dtos.request.auth;

import jakarta.validation.constraints.*;
import lombok.*;
import lydiacharif.nutridzbackend.Enums.*;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RegisterRequest {

    @NotBlank(message = "Username is required")
    @Size(min = 3, max = 50, message = "Username must be between 3 and 50 characters")
    private String username;

    @NotBlank(message = "Email is required")
    @Email(message = "Email must be valid")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 8, message = "Password must be at least 8 characters")
    private String password;

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
}