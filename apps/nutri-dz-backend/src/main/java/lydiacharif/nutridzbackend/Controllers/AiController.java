package lydiacharif.nutridzbackend.Controllers;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import lydiacharif.nutridzbackend.Enums.FoodCategory;
import lydiacharif.nutridzbackend.Enums.FoodSource;
import lydiacharif.nutridzbackend.Enums.NutritionalScore;
import lydiacharif.nutridzbackend.Models.Food;
import lydiacharif.nutridzbackend.Models.User;
import lydiacharif.nutridzbackend.Repositories.FoodRepository;
import lydiacharif.nutridzbackend.Repositories.UserRepository;
import lydiacharif.nutridzbackend.Security.CustomUserPrincipal;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.*;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
@Slf4j
@SecurityRequirement(name = "bearer-jwt")
@Tag(name = "AI Features", description = "Food photo analysis and daily meal improvement suggestions")
public class AiController {

    private final WebClient webClient;
    private final UserRepository userRepository;
    private final FoodRepository foodRepository;

    @Value("${ai.service.url}")
    private String aiServiceUrl;

    @Operation(summary = "Analyze a food photo")
    @PostMapping(value = "/analyze-image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, Object>> analyzeImage(
            @RequestParam("image") MultipartFile image,
            @AuthenticationPrincipal CustomUserPrincipal principal) {
        try {
            User user = userRepository.findById(principal.user().getId())
                    .orElseThrow(() -> new RuntimeException("User not found"));

            String base64Image = Base64.getEncoder().encodeToString(image.getBytes());

            Map<String, Object> payload = new HashMap<>();
            payload.put("imageBase64", base64Image);
            payload.put("mimeType", image.getContentType() != null ? image.getContentType() : "image/jpeg");
            payload.put("userContext", buildUserContext(user));

            Map response = webClient.post()
                    .uri(aiServiceUrl + "/ai/analyze-food-image")
                    .bodyValue(payload)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            if (response == null) {
                return ResponseEntity.ok(Map.of("foods", List.of(), "advice", "Pas de reponse"));
            }

            // Extract detected foods, match against DB or create new entries
            List<Map<String, Object>> detectedFoods = (List<Map<String, Object>>) response.getOrDefault("detectedFoods", List.of());
            List<Map<String, Object>> resolvedFoods = new ArrayList<>();

            for (Map<String, Object> detected : detectedFoods) {
                Map<String, Object> resolved = resolveDetectedFood(detected);
                if (resolved != null) resolvedFoods.add(resolved);
            }

            Map<String, Object> result = new HashMap<>();
            result.put("foods", resolvedFoods);
            result.put("advice", response.getOrDefault("advice", ""));
            return ResponseEntity.ok(result);

        } catch (Exception e) {
            log.error("Image analysis failed: {}", e.getMessage(), e);
            return ResponseEntity.ok(Map.of(
                    "foods", List.of(),
                    "advice", "Analyse non disponible. Reessaye avec une photo plus claire."
            ));
        }
    }

    private Map<String, Object> resolveDetectedFood(Map<String, Object> detected) {
        String name = (String) detected.get("name");
        if (name == null || name.isBlank()) return null;

        // Try to match an existing food in DB
        List<Food> matches = foodRepository.search(name);
        Food food;
        if (!matches.isEmpty()) {
            food = matches.get(0);
        } else {
            // Auto-create as AI_DETECTED food
            food = Food.builder()
                    .name(name)
                    .nameAr((String) detected.get("nameAr"))
                    .category(FoodCategory.ALGERIAN_DISH)
                    .source(FoodSource.AI_DETECTED)
                    .caloriesPer100g(toFloat(detected.get("caloriesPer100g")))
                    .proteinPer100g(toFloat(detected.get("proteinPer100g")))
                    .carbsPer100g(toFloat(detected.get("carbsPer100g")))
                    .fatPer100g(toFloat(detected.get("fatPer100g")))
                    .nutritionalScore(parseScore(detected.get("nutritionalScore")))
                    .verified(false)
                    .build();
            food = foodRepository.save(food);
        }

        Map<String, Object> result = new HashMap<>();
        result.put("id", food.getId());
        result.put("name", food.getName());
        result.put("nameAr", food.getNameAr());
        result.put("caloriesPer100g", food.getCaloriesPer100g());
        result.put("proteinPer100g", food.getProteinPer100g());
        result.put("carbsPer100g", food.getCarbsPer100g());
        result.put("fatPer100g", food.getFatPer100g());
        result.put("nutritionalScore", food.getNutritionalScore() != null ? food.getNutritionalScore().name() : null);
        result.put("confidence", detected.get("confidence"));
        result.put("estimatedPortionGrams", toFloat(detected.get("estimatedPortionGrams")));
        return result;
    }

    private Float toFloat(Object o) {
        if (o == null) return 0f;
        if (o instanceof Number n) return n.floatValue();
        try { return Float.parseFloat(o.toString()); } catch (Exception e) { return 0f; }
    }

    private NutritionalScore parseScore(Object o) {
        if (o == null) return null;
        try { return NutritionalScore.valueOf(o.toString().toUpperCase().trim()); }
        catch (Exception e) { return null; }
    }

    @PostMapping("/analyze-meal")
    public ResponseEntity<Map<String, Object>> analyzeMeal(
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal CustomUserPrincipal principal) {
        try {
            User user = userRepository.findById(principal.user().getId())
                    .orElseThrow(() -> new RuntimeException("User not found"));

            Map<String, Object> payload = new HashMap<>();
            payload.put("mealDescription", body.get("mealDescription"));
            payload.put("userContext", buildUserContext(user));

            Map<?, ?> response = webClient.post()
                    .uri(aiServiceUrl + "/ai/analyze-meal")
                    .bodyValue(payload)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            return ResponseEntity.ok(response != null ? (Map<String, Object>) response : Map.of());

        } catch (Exception e) {
            log.error("Meal analysis failed: {}", e.getMessage());
            return ResponseEntity.ok(Map.of("analysis", "Analyse non disponible pour le moment."));
        }
    }

    @PostMapping("/suggest")
    public ResponseEntity<Map<String, Object>> suggest(
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal CustomUserPrincipal principal) {
        try {
            User user = userRepository.findById(principal.user().getId())
                    .orElseThrow(() -> new RuntimeException("User not found"));

            Map<String, Object> payload = new HashMap<>();
            payload.put("mealDescription", body.get("todaysMeals"));
            payload.put("userContext", buildUserContext(user));

            Map<?, ?> response = webClient.post()
                    .uri(aiServiceUrl + "/ai/suggest-improvement")
                    .bodyValue(payload)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            return ResponseEntity.ok(response != null ? (Map<String, Object>) response : Map.of());

        } catch (Exception e) {
            log.error("Suggestion failed: {}", e.getMessage());
            return ResponseEntity.ok(Map.of("suggestion", "Suggestions non disponibles pour le moment."));
        }
    }

    private Map<String, Object> buildUserContext(User user) {
        Map<String, Object> ctx = new HashMap<>();
        ctx.put("nutritionGoal",      user.getNutritionGoal()    != null ? user.getNutritionGoal().name()    : null);
        ctx.put("dailyCalorieTarget", user.getDailyCalorieTarget());
        ctx.put("dailyProteinTarget", user.getDailyProteinTarget());
        ctx.put("dailyCarbTarget",    user.getDailyCarbTarget());
        ctx.put("dailyFatTarget",     user.getDailyFatTarget());
        ctx.put("diabetesType",       user.getDiabetesType()     != null ? user.getDiabetesType().name()     : "NONE");
        ctx.put("allergies",          user.getAllergies());
        ctx.put("activityLevel",      user.getActivityLevel()    != null ? user.getActivityLevel().name()    : null);
        ctx.put("weightKg",           user.getWeightKg());
        ctx.put("heightCm",           user.getHeightCm());
        return ctx;
    }
}
