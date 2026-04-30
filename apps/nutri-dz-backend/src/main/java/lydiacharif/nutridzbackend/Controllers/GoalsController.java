package lydiacharif.nutridzbackend.Controllers;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import lydiacharif.nutridzbackend.Dtos.request.hydration.LogWaterRequest;
import lydiacharif.nutridzbackend.Dtos.request.weight.LogWeightRequest;
import lydiacharif.nutridzbackend.Dtos.response.hydration.HydrationResponse;
import lydiacharif.nutridzbackend.Dtos.response.weight.WeightLogResponse;
import lydiacharif.nutridzbackend.Dtos.response.weight.WeightProgressResponse;
import lydiacharif.nutridzbackend.Security.CustomUserPrincipal;
import lydiacharif.nutridzbackend.Services.HydrationService;
import lydiacharif.nutridzbackend.Services.WeightService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/goals")
@RequiredArgsConstructor
@Slf4j
@SecurityRequirement(name = "bearer-jwt")
@Tag(name = "Goals", description = "Weight tracking and hydration goals")
public class GoalsController {

    private final WeightService weightService;
    private final HydrationService hydrationService;


    @Operation(summary = "Log weight",
            description = "Log today's weight (or a specific date). BMI is calculated automatically.")
    @PostMapping("/weight")
    public ResponseEntity<WeightLogResponse> logWeight(
            @AuthenticationPrincipal CustomUserPrincipal principal,
            @Valid @RequestBody LogWeightRequest request) {
        log.info("Log weight → user={} weight={}kg date={}",
                principal.user().getId(), request.getWeightKg(), request.getDate());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(weightService.logWeight(principal.user().getId(), request));
    }

    @Operation(summary = "Weight log history",
            description = "Returns the last 30 weight entries for the authenticated user.")
    @GetMapping("/weight")
    public ResponseEntity<List<WeightLogResponse>> getWeightHistory(
            @AuthenticationPrincipal CustomUserPrincipal principal) {
        WeightProgressResponse progress = weightService.getProgress(principal.user().getId());
        return ResponseEntity.ok(progress.getHistory());
    }

    @Operation(summary = "Weight progress summary",
            description = "Returns current weight, starting weight, BMI, and total change over the last 30 days.")
    @GetMapping("/progress")
    public ResponseEntity<WeightProgressResponse> getProgress(
            @AuthenticationPrincipal CustomUserPrincipal principal) {
        return ResponseEntity.ok(weightService.getProgress(principal.user().getId()));
    }

    @Operation(summary = "Delete a weight log entry")
    @DeleteMapping("/weight/{logId}")
    public ResponseEntity<Void> deleteWeightLog(
            @PathVariable Long logId,
            @AuthenticationPrincipal CustomUserPrincipal principal) {
        log.info("Delete weight log → user={} logId={}", principal.user().getId(), logId);
        weightService.deleteLog(principal.user().getId(), logId);
        return ResponseEntity.noContent().build();
    }



    @Operation(summary = "Get today's hydration",
            description = "Returns total water consumed today, target, glass count, and progress percent.")
    @GetMapping("/hydration")
    public ResponseEntity<HydrationResponse> getTodayHydration(
            @AuthenticationPrincipal CustomUserPrincipal principal) {
        return ResponseEntity.ok(hydrationService.getToday(principal.user().getId()));
    }

    @Operation(summary = "Log water intake",
            description = "Add millilitres of water to today's hydration log. Also syncs to the daily meal log.")
    @PostMapping("/hydration")
    public ResponseEntity<HydrationResponse> logWater(
            @AuthenticationPrincipal CustomUserPrincipal principal,
            @Valid @RequestBody LogWaterRequest request) {
        log.info("Log water → user={} +{}ml", principal.user().getId(), request.getMlToAdd());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(hydrationService.logWater(principal.user().getId(), request));
    }
}