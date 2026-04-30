package lydiacharif.nutridzbackend.Controllers;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import lydiacharif.nutridzbackend.Dtos.request.chat.ChatRequest;
import lydiacharif.nutridzbackend.Dtos.response.chat.ChatMessageResponse;
import lydiacharif.nutridzbackend.Dtos.response.chat.ChatResponse;
import lydiacharif.nutridzbackend.Security.CustomUserPrincipal;
import lydiacharif.nutridzbackend.Services.ChatService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
@Slf4j
@SecurityRequirement(name = "bearer-jwt")
@Tag(name = "AI Nutritionist Chat",
        description = "Multilingual AI nutritionist — supports French, Arabic, Darija, English")
public class ChatController {

    private final ChatService chatService;

    @Operation(
            summary = "Send a message to the AI nutritionist",
            description = """
            Send a nutrition question in any supported language:
            - French: "Est-ce que mon repas est équilibré ?"
            - Arabic: "هل وجبتي متوازنة؟"
            - Darija: "Wach meklti mzyana?"
            - English: "Is my meal balanced?"
            
            The AI responds in the same language you write in.
            Context from your profile (goals, calories, allergies, diabetes) is sent automatically.
            """
    )
    @PostMapping
    public ResponseEntity<ChatResponse> sendMessage(
            @AuthenticationPrincipal CustomUserPrincipal principal,
            @Valid @RequestBody ChatRequest request) {
        log.info("Chat message from user={}", principal.user().getId());
        return ResponseEntity.ok(chatService.sendMessage(principal.user().getId(), request));
    }

    @Operation(summary = "Get full chat history")
    @GetMapping("/history")
    public ResponseEntity<List<ChatMessageResponse>> getHistory(
            @AuthenticationPrincipal CustomUserPrincipal principal) {
        return ResponseEntity.ok(chatService.getHistory(principal.user().getId()));
    }

    @Operation(summary = "Clear chat history")
    @DeleteMapping("/history")
    public ResponseEntity<Void> clearHistory(
            @AuthenticationPrincipal CustomUserPrincipal principal) {
        chatService.clearHistory(principal.user().getId());
        return ResponseEntity.noContent().build();
    }
}