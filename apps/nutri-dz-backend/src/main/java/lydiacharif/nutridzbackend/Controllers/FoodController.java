package lydiacharif.nutridzbackend.Controllers;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import lydiacharif.nutridzbackend.Dtos.request.food.LogFoodRequest;
import lydiacharif.nutridzbackend.Dtos.response.food.DailyJournalResponse;
import lydiacharif.nutridzbackend.Dtos.response.food.FoodResponse;
import lydiacharif.nutridzbackend.Dtos.response.food.JournalEntryResponse;
import lydiacharif.nutridzbackend.Enums.FoodCategory;
import lydiacharif.nutridzbackend.Security.CustomUserPrincipal;
import lydiacharif.nutridzbackend.Services.FoodService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequiredArgsConstructor
@Slf4j
@SecurityRequirement(name = "bearer-jwt")
@Tag(name = "Food & Journal", description = "Food search, barcode scanning, and daily food logging")
public class FoodController {

    private final FoodService foodService;

    @Operation(summary = "Search foods by name")
    @GetMapping("/api/foods/search")
    public ResponseEntity<List<FoodResponse>> search(@RequestParam String q) {
        return ResponseEntity.ok(foodService.searchFoods(q));
    }

    @Operation(summary = "Get food by ID")
    @GetMapping("/api/foods/{id}")
    public ResponseEntity<FoodResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(foodService.getFoodById(id));
    }

    @Operation(summary = "Get food by barcode")
    @GetMapping("/api/foods/barcode/{barcode}")
    public ResponseEntity<FoodResponse> getByBarcode(@PathVariable String barcode) {
        return ResponseEntity.ok(foodService.getFoodByBarcode(barcode));
    }

    @Operation(summary = "Get foods by category")
    @GetMapping("/api/foods/category/{category}")
    public ResponseEntity<List<FoodResponse>> getByCategory(@PathVariable FoodCategory category) {
        return ResponseEntity.ok(foodService.getFoodsByCategory(category));
    }

    @Operation(summary = "Log a food or recipe entry")
    @PostMapping("/api/journal")
    public ResponseEntity<JournalEntryResponse> logFood(
            @AuthenticationPrincipal CustomUserPrincipal principal,
            @Valid @RequestBody LogFoodRequest request) {
        log.info("Log food request for user {}", principal.user().getId());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(foodService.logFood(principal.user().getId(), request));
    }

    @Operation(summary = "Get daily journal — all meals + totals + progress")
    @GetMapping("/api/journal/daily")
    public ResponseEntity<DailyJournalResponse> getDailyJournal(
            @AuthenticationPrincipal CustomUserPrincipal principal,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        LocalDate target = date != null ? date : LocalDate.now();
        return ResponseEntity.ok(foodService.getDailyJournal(principal.user().getId(), target));
    }

    @Operation(summary = "Delete a journal entry")
    @DeleteMapping("/api/journal/{entryId}")
    public ResponseEntity<Void> deleteEntry(
            @AuthenticationPrincipal CustomUserPrincipal principal,
            @PathVariable Long entryId) {
        foodService.deleteJournalEntry(principal.user().getId(), entryId);
        return ResponseEntity.noContent().build();
    }
}