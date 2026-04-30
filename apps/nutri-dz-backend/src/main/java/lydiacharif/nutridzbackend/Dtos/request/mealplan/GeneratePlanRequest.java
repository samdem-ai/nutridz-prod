package lydiacharif.nutridzbackend.Dtos.request.mealplan;

import jakarta.validation.constraints.*;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GeneratePlanRequest {

    @NotNull
    @Min(value = 3, message = "Minimum 3 days")
    @Max(value = 7, message = "Maximum 7 days")
    private Integer days;

    private Boolean preferAlgerian;   
    private Boolean vegetarian;
    private Boolean lowCarb;
}