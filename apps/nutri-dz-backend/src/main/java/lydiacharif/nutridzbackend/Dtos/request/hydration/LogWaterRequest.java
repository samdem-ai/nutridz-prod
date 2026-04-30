package lydiacharif.nutridzbackend.Dtos.request.hydration;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

@Data
public class LogWaterRequest {

    @NotNull
    @Positive
    private Float mlToAdd; 
}