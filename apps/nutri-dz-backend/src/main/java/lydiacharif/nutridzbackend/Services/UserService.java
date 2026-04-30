package lydiacharif.nutridzbackend.Services;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import lydiacharif.nutridzbackend.Dtos.request.auth.LoginRequest;
import lydiacharif.nutridzbackend.Dtos.request.auth.RegisterRequest;
import lydiacharif.nutridzbackend.Dtos.request.auth.UpdateProfileRequest;
import lydiacharif.nutridzbackend.Dtos.response.auth.AuthResponse;
import lydiacharif.nutridzbackend.Dtos.response.auth.UserResponse;
import lydiacharif.nutridzbackend.Enums.DiabetesType;
import lydiacharif.nutridzbackend.Enums.Role;
import lydiacharif.nutridzbackend.Exceptions.InvalidRequestException;
import lydiacharif.nutridzbackend.Exceptions.ResourceAlreadyExistsException;
import lydiacharif.nutridzbackend.Exceptions.ResourceNotFoundException;
import lydiacharif.nutridzbackend.Models.User;
import lydiacharif.nutridzbackend.Repositories.UserRepository;
import lydiacharif.nutridzbackend.Security.JwtUtil;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        log.info("Registering user with email: {}", request.getEmail());

        if (userRepository.existsByEmail(request.getEmail()))
            throw new ResourceAlreadyExistsException("User", "email", request.getEmail());
        if (userRepository.existsByUsername(request.getUsername()))
            throw new ResourceAlreadyExistsException("User", "username", request.getUsername());

        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(Role.USER)
                .gender(request.getGender())
                .birthDate(request.getBirthDate())
                .heightCm(request.getHeightCm())
                .weightKg(request.getWeightKg())
                .activityLevel(request.getActivityLevel())
                .workType(request.getWorkType())
                .workoutType(request.getWorkoutType())
                .diabetesType(request.getDiabetesType() != null ? request.getDiabetesType() : DiabetesType.NONE)
                .allergies(request.getAllergies())
                .nutritionGoal(request.getNutritionGoal())
                .createdAt(LocalDateTime.now())
                .build();

        if (user.getWeightKg() != null && user.getHeightCm() != null &&
                user.getBirthDate() != null && user.getActivityLevel() != null) {
            calculateAndSetTargets(user);
        }

        User saved = userRepository.save(user);
        String token = jwtUtil.generateToken(saved);

        log.info("User registered successfully with ID: {}", saved.getId());

        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .userId(saved.getId())
                .username(saved.getUsername())
                .email(saved.getEmail())
                .expiresIn(jwtUtil.getExpirationTime())
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        log.info("Login attempt for email: {}", request.getEmail());
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new InvalidRequestException("Invalid email or password"));
        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash()))
            throw new InvalidRequestException("Invalid email or password");
        String token = jwtUtil.generateToken(user);

        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .userId(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .expiresIn(jwtUtil.getExpirationTime())
                .build();
    }

    public UserResponse getCurrentUser(Long userId) {
        log.info("Fetching user with ID: {}", userId);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));
        return mapToUserResponse(user);
    }

    @Transactional
    public UserResponse updateProfile(Long userId, UpdateProfileRequest request) {
        log.info("Updating profile for user ID: {}", userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        if (request.getUsername() != null) user.setUsername(request.getUsername());
        if (request.getGender() != null) user.setGender(request.getGender());
        if (request.getBirthDate() != null) user.setBirthDate(request.getBirthDate());
        if (request.getHeightCm() != null) user.setHeightCm(request.getHeightCm());
        if (request.getWeightKg() != null) user.setWeightKg(request.getWeightKg());
        if (request.getActivityLevel() != null) user.setActivityLevel(request.getActivityLevel());
        if (request.getWorkType() != null) user.setWorkType(request.getWorkType());
        if (request.getWorkoutType() != null) user.setWorkoutType(request.getWorkoutType());
        if (request.getDiabetesType() != null) user.setDiabetesType(request.getDiabetesType());
        if (request.getAllergies() != null) user.setAllergies(request.getAllergies());
        if (request.getNutritionGoal() != null) user.setNutritionGoal(request.getNutritionGoal());

        // Auto-calculate targets if profile complete (only if user hasn't customized)
        boolean targetsProvided =
                request.getDailyCalorieTarget() != null ||
                request.getDailyProteinTarget() != null ||
                request.getDailyCarbTarget() != null ||
                request.getDailyFatTarget() != null ||
                request.getDailyWaterTargetMl() != null;

        if (!targetsProvided
                && user.getWeightKg() != null && user.getHeightCm() != null
                && user.getBirthDate() != null && user.getActivityLevel() != null) {
            calculateAndSetTargets(user);
        }

        // Apply user-provided overrides (after auto-calc so they win)
        if (request.getDailyCalorieTarget() != null) user.setDailyCalorieTarget(request.getDailyCalorieTarget());
        if (request.getDailyProteinTarget() != null) user.setDailyProteinTarget(request.getDailyProteinTarget());
        if (request.getDailyCarbTarget() != null)    user.setDailyCarbTarget(request.getDailyCarbTarget());
        if (request.getDailyFatTarget() != null)     user.setDailyFatTarget(request.getDailyFatTarget());
        if (request.getDailyWaterTargetMl() != null) user.setDailyWaterTargetMl(request.getDailyWaterTargetMl());
        if (request.getAvatarUrl() != null) user.setAvatarUrl(request.getAvatarUrl());

        User updated = userRepository.save(user);
        return mapToUserResponse(updated);
    }

    private void calculateAndSetTargets(User user) {
        int age = LocalDateTime.now().getYear() - user.getBirthDate().getYear();
        float bmr;

        if (user.getGender() != null) {
            bmr = switch (user.getGender()) {
                case MALE   -> 10 * user.getWeightKg() + 6.25f * user.getHeightCm() - 5 * age + 5;
                case FEMALE -> 10 * user.getWeightKg() + 6.25f * user.getHeightCm() - 5 * age - 161;
                default     -> 10 * user.getWeightKg() + 6.25f * user.getHeightCm() - 5 * age - 78;
            };
        } else {
            bmr = 10 * user.getWeightKg() + 6.25f * user.getHeightCm() - 5 * age - 78;
        }

        float tdee = bmr * switch (user.getActivityLevel()) {
            case SEDENTARY    -> 1.2f;
            case LIGHT        -> 1.375f;
            case MODERATE     -> 1.55f;
            case VERY_ACTIVE  -> 1.725f;
            case EXTRA_ACTIVE -> 1.9f;
        };

        float calories = user.getNutritionGoal() != null ? switch (user.getNutritionGoal()) {
            case WEIGHT_LOSS -> tdee - 500;
            case MUSCLE_GAIN -> tdee + 300;
            default          -> tdee;
        } : tdee;

        user.setDailyCalorieTarget(calories);
        user.setDailyProteinTarget(user.getWeightKg() * 2.0f);
        user.setDailyCarbTarget(calories * 0.45f / 4);
        user.setDailyFatTarget(calories * 0.25f / 9);
        user.setDailyWaterTargetMl(user.getWeightKg() * 35);
    }

    private UserResponse mapToUserResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .role(user.getRole())
                .gender(user.getGender())
                .birthDate(user.getBirthDate())
                .heightCm(user.getHeightCm())
                .weightKg(user.getWeightKg())
                .activityLevel(user.getActivityLevel())
                .workType(user.getWorkType())
                .workoutType(user.getWorkoutType())
                .diabetesType(user.getDiabetesType())
                .allergies(user.getAllergies())
                .nutritionGoal(user.getNutritionGoal())
                .dailyCalorieTarget(user.getDailyCalorieTarget())
                .dailyProteinTarget(user.getDailyProteinTarget())
                .dailyCarbTarget(user.getDailyCarbTarget())
                .dailyFatTarget(user.getDailyFatTarget())
                .dailyWaterTargetMl(user.getDailyWaterTargetMl())
                .avatarUrl(user.getAvatarUrl())
                .createdAt(user.getCreatedAt())
                .build();
    }
}