package lydiacharif.nutridzbackend.Services;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import lydiacharif.nutridzbackend.Dtos.request.chat.ChatRequest;
import lydiacharif.nutridzbackend.Dtos.response.chat.ChatMessageResponse;
import lydiacharif.nutridzbackend.Dtos.response.chat.ChatResponse;
import lydiacharif.nutridzbackend.Enums.MessageRole;
import lydiacharif.nutridzbackend.Exceptions.AiServiceException;
import lydiacharif.nutridzbackend.Exceptions.ResourceNotFoundException;
import lydiacharif.nutridzbackend.Models.ChatMessage;
import lydiacharif.nutridzbackend.Models.User;
import lydiacharif.nutridzbackend.Repositories.ChatMessageRepository;
import lydiacharif.nutridzbackend.Repositories.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChatService {

    private final ChatMessageRepository chatMessageRepository;
    private final UserRepository userRepository;
    private final WebClient webClient;

    @Value("${ai.service.url}")
    private String aiServiceUrl;

    private static final int HISTORY_LIMIT = 20;

    @Transactional
    public ChatResponse sendMessage(Long userId, ChatRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        ChatMessage userMessage = ChatMessage.builder()
                .userId(userId)
                .role(MessageRole.USER)
                .content(request.getMessage())
                .sentAt(LocalDateTime.now())
                .build();
        chatMessageRepository.save(userMessage);

        List<ChatMessage> history = chatMessageRepository
                .findByUserIdOrderedAsc(userId, HISTORY_LIMIT);

        Map<String, Object> payload = new HashMap<>();
        payload.put("message", request.getMessage());
        payload.put("userContext", buildUserContext(user));
        payload.put("history", history.stream()
                .map(m -> Map.of("role", m.getRole().name(), "content", m.getContent()))
                .collect(Collectors.toList()));

        String aiReply;
        try {
            Map<?, ?> response = webClient.post()
                    .uri(aiServiceUrl + "/ai/chat")
                    .bodyValue(payload)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            if (response == null || response.get("reply") == null)
                throw new AiServiceException("empty response from AI");

            aiReply = response.get("reply").toString();
        } catch (AiServiceException e) {
            throw e;
        } catch (Exception e) {
            log.error("AI service call failed: {}", e.getMessage());
            throw new AiServiceException(e.getMessage());
        }

        ChatMessage assistantMessage = ChatMessage.builder()
                .userId(userId)
                .role(MessageRole.ASSISTANT)
                .content(aiReply)
                .sentAt(LocalDateTime.now())
                .build();
        chatMessageRepository.save(assistantMessage);

        log.info("Chat message processed for user={}", userId);

        return ChatResponse.builder()
                .reply(aiReply)
                .sentAt(assistantMessage.getSentAt())
                .build();
    }

    public List<ChatMessageResponse> getHistory(Long userId) {
        return chatMessageRepository.findByUserId(userId)
                .stream()
                .map(m -> ChatMessageResponse.builder()
                        .id(m.getId())
                        .role(m.getRole())
                        .content(m.getContent())
                        .sentAt(m.getSentAt())
                        .build())
                .collect(Collectors.toList());
    }

    @Transactional
    public void clearHistory(Long userId) {
        chatMessageRepository.deleteByUserId(userId);
        log.info("Chat history cleared for user={}", userId);
    }

    private Map<String, Object> buildUserContext(User user) {
        Map<String, Object> ctx = new HashMap<>();
        ctx.put("nutritionGoal",      user.getNutritionGoal()  != null ? user.getNutritionGoal().name()  : null);
        ctx.put("dailyCalorieTarget", user.getDailyCalorieTarget());
        ctx.put("dailyProteinTarget", user.getDailyProteinTarget());
        ctx.put("dailyCarbTarget",    user.getDailyCarbTarget());
        ctx.put("dailyFatTarget",     user.getDailyFatTarget());
        ctx.put("diabetesType",       user.getDiabetesType()   != null ? user.getDiabetesType().name()   : "NONE");
        ctx.put("allergies",          user.getAllergies());
        ctx.put("activityLevel",      user.getActivityLevel()  != null ? user.getActivityLevel().name()  : null);
        ctx.put("weightKg",           user.getWeightKg());
        ctx.put("heightCm",           user.getHeightCm());
        return ctx;
    }
}