package lydiacharif.nutridzbackend.Dtos.request.admin;

import jakarta.validation.constraints.*;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ServingSizeDto {
    @NotBlank @Size(max = 100)
    private String label;
    @NotNull @Positive @Max(5000)
    private Float grams;
}
