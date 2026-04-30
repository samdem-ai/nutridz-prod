package lydiacharif.nutridzbackend.Dtos.response.chat;

import lombok.*;
import lydiacharif.nutridzbackend.Enums.MessageRole;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatMessageResponse {
    private Long id;
    private MessageRole role;
    private String content;
    private LocalDateTime sentAt;
}