package lydiacharif.nutridzbackend.Dtos.request.admin;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RejectRequest {
    @NotBlank(message = "A reason is required") @Size(max = 500)
    private String reason;
}
