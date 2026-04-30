package lydiacharif.nutridzbackend.Controllers;

import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lydiacharif.nutridzbackend.Security.CustomUserPrincipal;
import lydiacharif.nutridzbackend.Services.GamificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/gamification")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearer-jwt")
@Tag(name = "Gamification", description = "Streaks and achievements")
public class GamificationController {

    private final GamificationService service;

    @GetMapping("/streak")
    public ResponseEntity<Map<String, Object>> getStreak(
            @AuthenticationPrincipal CustomUserPrincipal principal) {
        return ResponseEntity.ok(service.getStreak(principal.user().getId()));
    }

    @GetMapping("/achievements")
    public ResponseEntity<Map<String, Object>> getAchievements(
            @AuthenticationPrincipal CustomUserPrincipal principal) {
        return ResponseEntity.ok(service.getAchievements(principal.user().getId()));
    }
}
