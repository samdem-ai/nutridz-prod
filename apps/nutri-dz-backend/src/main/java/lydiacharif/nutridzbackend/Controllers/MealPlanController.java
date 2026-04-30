package lydiacharif.nutridzbackend.Controllers;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import lydiacharif.nutridzbackend.Dtos.request.mealplan.GeneratePlanRequest;
import lydiacharif.nutridzbackend.Dtos.response.mealplan.MealPlanResponse;
import lydiacharif.nutridzbackend.Security.CustomUserPrincipal;
import lydiacharif.nutridzbackend.Services.MealPlanService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/meal-plans")
@RequiredArgsConstructor
@Slf4j
@SecurityRequirement(name = "bearer-jwt")
@Tag(name = "Meal Plans", description = "AI-generated personalized meal plans with Algerian cuisine focus")
public class MealPlanController {

    private final MealPlanService mealPlanService;

    @Operation(summary = "Generate a new meal plan (3–7 days)",
            description = "Generates a personalized plan based on user goals and dietary preferences. " +
                    "Set preferAlgerian=true to prioritize Algerian dishes like couscous, chorba, rechta.")
    @PostMapping("/generate")
    public ResponseEntity<MealPlanResponse> generate(
            @AuthenticationPrincipal CustomUserPrincipal principal,
            @Valid @RequestBody GeneratePlanRequest request) {
        log.info("Generate meal plan for user={} days={} algerian={}",
                principal.user().getId(), request.getDays(), request.getPreferAlgerian());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(mealPlanService.generate(principal.user().getId(), request));
    }

    @Operation(summary = "Get all my meal plans")
    @GetMapping
    public ResponseEntity<List<MealPlanResponse>> getMyPlans(
            @AuthenticationPrincipal CustomUserPrincipal principal) {
        return ResponseEntity.ok(mealPlanService.getMyPlans(principal.user().getId()));
    }

    @Operation(summary = "Get a specific meal plan by ID")
    @GetMapping("/{planId}")
    public ResponseEntity<MealPlanResponse> getById(
            @PathVariable Long planId,
            @AuthenticationPrincipal CustomUserPrincipal principal) {
        return ResponseEntity.ok(mealPlanService.getById(principal.user().getId(), planId));
    }

    @Operation(summary = "Delete a meal plan")
    @DeleteMapping("/{planId}")
    public ResponseEntity<Void> delete(
            @PathVariable Long planId,
            @AuthenticationPrincipal CustomUserPrincipal principal) {
        mealPlanService.deletePlan(principal.user().getId(), planId);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Toggle a shopping list item checked/unchecked")
    @PatchMapping("/{planId}/shopping/{itemId}/toggle")
    public ResponseEntity<Void> toggleShoppingItem(
            @PathVariable Long planId,
            @PathVariable Long itemId,
            @AuthenticationPrincipal CustomUserPrincipal principal) {
        mealPlanService.toggleShoppingItem(principal.user().getId(), planId, itemId);
        return ResponseEntity.ok().build();
    }
}