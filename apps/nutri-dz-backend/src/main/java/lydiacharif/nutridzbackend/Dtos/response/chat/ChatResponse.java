package lydiacharif.nutridzbackend.Dtos.response.chat;

import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatResponse {
    private String reply;
    private LocalDateTime sentAt;
}