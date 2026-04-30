package lydiacharif.nutridzbackend.Dtos.request.recipe;

import jakarta.validation.constraints.*;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AddCommentRequest {

    @NotBlank(message = "Comment cannot be empty")
    @Size(max = 1000)
    private String content;
}