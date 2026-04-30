package lydiacharif.nutridzbackend.Models;

import lombok.*;
import lydiacharif.nutridzbackend.Enums.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatMessage {
    private Long id;
    private Long userId;
    private MessageRole role;
    private String content;
    private LocalDateTime sentAt;
}