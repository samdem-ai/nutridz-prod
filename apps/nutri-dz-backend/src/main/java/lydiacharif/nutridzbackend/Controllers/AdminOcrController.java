package lydiacharif.nutridzbackend.Controllers;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Admin-only label OCR. Forwards a nutrition-label photo to the AI service's
 * vision provider (Groq by default) and returns structured per-100g values.
 * The vision API key stays on the server — it is never exposed to the browser.
 * Access restricted to ROLE_ADMIN by SecurityConfig (/api/admin/**).
 */
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@Slf4j
@SecurityRequirement(name = "bearer-jwt")
@Tag(name = "Admin — OCR", description = "Read nutrition labels with a vision model")
public class AdminOcrController {

    private static final Pattern DATA_URI = Pattern.compile("^data:([^;]+);base64,(.*)$", Pattern.DOTALL);

    private final WebClient webClient;

    @Value("${ai.service.url}")
    private String aiServiceUrl;

    @Operation(summary = "Read a nutrition label into structured per-100g values")
    @PostMapping("/ocr-label")
    public ResponseEntity<Map<String, Object>> ocrLabel(@RequestBody Map<String, String> body) {
        String image = body.get("image");
        if (image == null || image.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("found", false, "error", "no image"));
        }

        String mime = "image/jpeg";
        String base64 = image.trim();
        Matcher m = DATA_URI.matcher(base64);
        if (m.matches()) {
            mime = m.group(1);
            base64 = m.group(2);
        }

        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> resp = webClient.post()
                    .uri(aiServiceUrl + "/ai/read-label")
                    .bodyValue(Map.of("imageBase64", base64, "mimeType", mime))
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block(Duration.ofSeconds(70));
            return ResponseEntity.ok(resp != null ? resp : Map.of("found", false));
        } catch (Exception e) {
            log.warn("Label OCR failed: {}", e.getMessage());
            // 200 with found:false so the client can fall back to on-device OCR
            return ResponseEntity.ok(Map.of("found", false, "error", "vision unavailable"));
        }
    }
}
