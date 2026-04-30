package lydiacharif.nutridzbackend.Services;

import lydiacharif.nutridzbackend.Dtos.request.food.LogFoodRequest;
import lydiacharif.nutridzbackend.Dtos.response.food.JournalEntryResponse;
import lydiacharif.nutridzbackend.Enums.LogSource;
import lydiacharif.nutridzbackend.Enums.MealType;
import lydiacharif.nutridzbackend.Models.Food;
import lydiacharif.nutridzbackend.Models.JournalEntry;
import lydiacharif.nutridzbackend.Repositories.FoodRepository;
import lydiacharif.nutridzbackend.Repositories.JournalEntryRepository;
import lydiacharif.nutridzbackend.Repositories.MealLogRepository;
import lydiacharif.nutridzbackend.Repositories.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FoodServiceTest {

    @Mock private FoodRepository foodRepository;
    @Mock private JournalEntryRepository journalEntryRepository;
    @Mock private MealLogRepository mealLogRepository;
    @Mock private UserRepository userRepository;
    @Mock private GamificationService gamificationService;

    @InjectMocks private FoodService service;

    private Food sampleFood;

    @BeforeEach
    void setup() {
        sampleFood = Food.builder()
                .id(1L)
                .name("Couscous")
                .caloriesPer100g(150f)
                .proteinPer100g(5f)
                .carbsPer100g(28f)
                .fatPer100g(2f)
                .build();
    }

    @Test
    void logFood_calculatesNutritionBasedOnQuantity() {
        when(foodRepository.findById(1L)).thenReturn(Optional.of(sampleFood));
        when(journalEntryRepository.save(any())).thenAnswer(inv -> {
            JournalEntry e = inv.getArgument(0);
            e.setId(99L);
            return e;
        });
        when(mealLogRepository.findByUserAndDate(anyLong(), any())).thenReturn(Optional.empty());
        when(mealLogRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        LogFoodRequest req = LogFoodRequest.builder()
                .foodId(1L)
                .quantityGrams(200f)  // double portion
                .mealType(MealType.LUNCH)
                .logSource(LogSource.MANUAL_SEARCH)
                .date(LocalDate.of(2026, 1, 15))
                .build();

        JournalEntryResponse resp = service.logFood(42L, req);

        // 200g of food at 150kcal/100g = 300 kcal
        assertEquals(300f, resp.getCaloriesConsumed(), 0.01);
        assertEquals(10f, resp.getProteinConsumed(), 0.01);
        assertEquals(56f, resp.getCarbsConsumed(), 0.01);
        assertEquals(4f, resp.getFatConsumed(), 0.01);
        assertEquals(MealType.LUNCH, resp.getMealType());
        assertEquals("Couscous", resp.getFoodName());
    }

    @Test
    void logFood_smallPortion_calculatesProportionally() {
        when(foodRepository.findById(1L)).thenReturn(Optional.of(sampleFood));
        when(journalEntryRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(mealLogRepository.findByUserAndDate(anyLong(), any())).thenReturn(Optional.empty());
        when(mealLogRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        LogFoodRequest req = LogFoodRequest.builder()
                .foodId(1L)
                .quantityGrams(50f)
                .mealType(MealType.SNACK)
                .logSource(LogSource.AI_PHOTO)
                .date(LocalDate.now())
                .build();

        JournalEntryResponse resp = service.logFood(1L, req);

        // 50g at 150kcal/100g = 75 kcal
        assertEquals(75f, resp.getCaloriesConsumed(), 0.01);
        assertEquals(2.5f, resp.getProteinConsumed(), 0.01);
    }

    @Test
    void logFood_neitherFoodNorRecipe_throws() {
        LogFoodRequest req = LogFoodRequest.builder()
                .quantityGrams(100f)
                .mealType(MealType.LUNCH)
                .logSource(LogSource.MANUAL_SEARCH)
                .build();

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> service.logFood(1L, req));
        assertTrue(ex.getMessage().contains("foodId or recipeId"));
    }

    @Test
    void logFood_bothFoodAndRecipe_throws() {
        LogFoodRequest req = LogFoodRequest.builder()
                .foodId(1L)
                .recipeId(2L)
                .quantityGrams(100f)
                .mealType(MealType.LUNCH)
                .logSource(LogSource.MANUAL_SEARCH)
                .build();

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> service.logFood(1L, req));
        assertTrue(ex.getMessage().contains("either foodId or recipeId, not both"));
    }

    @Test
    void logFood_triggersGamification() {
        when(foodRepository.findById(1L)).thenReturn(Optional.of(sampleFood));
        when(journalEntryRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(mealLogRepository.findByUserAndDate(anyLong(), any())).thenReturn(Optional.empty());
        when(mealLogRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        LogFoodRequest req = LogFoodRequest.builder()
                .foodId(1L)
                .quantityGrams(100f)
                .mealType(MealType.LUNCH)
                .logSource(LogSource.AI_PHOTO)
                .date(LocalDate.of(2026, 1, 15))
                .build();

        service.logFood(7L, req);

        verify(gamificationService).recordActivity(7L, LocalDate.of(2026, 1, 15));
        verify(gamificationService).checkCountBased(7L, "JOURNAL");
        verify(gamificationService).checkCountBased(7L, "AI_PHOTO");
    }
}
