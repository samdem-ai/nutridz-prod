package lydiacharif.nutridzbackend.Dtos.request.chat;

import jakarta.validation.constraints.*;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatRequest {

    @NotBlank(message = "Message cannot be empty")
    @Size(max = 2000, message = "Message too long")
    private String message;
}