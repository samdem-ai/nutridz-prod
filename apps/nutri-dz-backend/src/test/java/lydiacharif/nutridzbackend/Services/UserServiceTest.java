package lydiacharif.nutridzbackend.Services;

import lydiacharif.nutridzbackend.Dtos.request.auth.RegisterRequest;
import lydiacharif.nutridzbackend.Dtos.request.auth.UpdateProfileRequest;
import lydiacharif.nutridzbackend.Enums.ActivityLevel;
import lydiacharif.nutridzbackend.Enums.Gender;
import lydiacharif.nutridzbackend.Enums.NutritionGoal;
import lydiacharif.nutridzbackend.Exceptions.ResourceAlreadyExistsException;
import lydiacharif.nutridzbackend.Models.User;
import lydiacharif.nutridzbackend.Repositories.UserRepository;
import lydiacharif.nutridzbackend.Security.JwtUtil;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private JwtUtil jwtUtil;

    @InjectMocks private UserService service;

    @Test
    void register_existingEmail_throws() {
        when(userRepository.existsByEmail("dup@x.com")).thenReturn(true);
        RegisterRequest req = new RegisterRequest();
        req.setEmail("dup@x.com");
        req.setUsername("u");
        req.setPassword("p");

        assertThrows(ResourceAlreadyExistsException.class, () -> service.register(req));
        verify(userRepository, never()).save(any());
    }

    @Test
    void register_existingUsername_throws() {
        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(userRepository.existsByUsername("taken")).thenReturn(true);
        RegisterRequest req = new RegisterRequest();
        req.setEmail("new@x.com");
        req.setUsername("taken");
        req.setPassword("p");

        assertThrows(ResourceAlreadyExistsException.class, () -> service.register(req));
    }

    @Test
    void updateProfile_autoComputesTargets_whenProfileComplete() {
        User existing = User.builder()
                .id(1L)
                .username("test")
                .email("t@x.com")
                .build();
        when(userRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(userRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        UpdateProfileRequest req = UpdateProfileRequest.builder()
                .gender(Gender.MALE)
                .birthDate(LocalDate.of(1995, 1, 1))
                .heightCm(180f)
                .weightKg(80f)
                .activityLevel(ActivityLevel.MODERATE)
                .nutritionGoal(NutritionGoal.MAINTENANCE)
                .build();

        var resp = service.updateProfile(1L, req);

        // BMR for 30yo, 80kg, 180cm male = 10*80 + 6.25*180 - 5*30 + 5 = 1780
        // TDEE moderate = 1780 * 1.55 ≈ 2759
        // MAINTENANCE keeps TDEE
        assertNotNull(resp.getDailyCalorieTarget());
        assertTrue(resp.getDailyCalorieTarget() > 2000);
        assertTrue(resp.getDailyCalorieTarget() < 3500);
        // Protein at 2g per kg = 160
        assertEquals(160f, resp.getDailyProteinTarget(), 1f);
        // Water at 35ml per kg = 2800
        assertEquals(2800f, resp.getDailyWaterTargetMl(), 1f);
    }

    @Test
    void updateProfile_userOverridesWinOverAutoCalc() {
        User existing = User.builder()
                .id(1L)
                .gender(Gender.MALE)
                .birthDate(LocalDate.of(1995, 1, 1))
                .heightCm(180f)
                .weightKg(80f)
                .activityLevel(ActivityLevel.MODERATE)
                .build();
        when(userRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(userRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        UpdateProfileRequest req = UpdateProfileRequest.builder()
                .dailyCalorieTarget(1500f)
                .dailyProteinTarget(120f)
                .dailyCarbTarget(150f)
                .dailyFatTarget(50f)
                .dailyWaterTargetMl(2500f)
                .build();

        var resp = service.updateProfile(1L, req);

        assertEquals(1500f, resp.getDailyCalorieTarget());
        assertEquals(120f, resp.getDailyProteinTarget());
        assertEquals(150f, resp.getDailyCarbTarget());
        assertEquals(50f, resp.getDailyFatTarget());
        assertEquals(2500f, resp.getDailyWaterTargetMl());
    }

    @Test
    void updateProfile_femaleBmrLowerThanMale() {
        User user = User.builder().id(1L).build();
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(userRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        UpdateProfileRequest req = UpdateProfileRequest.builder()
                .gender(Gender.FEMALE)
                .birthDate(LocalDate.of(1995, 1, 1))
                .heightCm(170f)
                .weightKg(60f)
                .activityLevel(ActivityLevel.SEDENTARY)
                .build();

        var resp = service.updateProfile(1L, req);
        // BMR female = 10*60 + 6.25*170 - 5*30 - 161 = 1351.5
        // TDEE sedentary = 1351.5 * 1.2 = 1622
        assertTrue(resp.getDailyCalorieTarget() < 1800);
        assertTrue(resp.getDailyCalorieTarget() > 1400);
    }
}
