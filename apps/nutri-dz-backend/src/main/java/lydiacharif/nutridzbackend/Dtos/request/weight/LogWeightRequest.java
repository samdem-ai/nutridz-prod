package lydiacharif.nutridzbackend.Dtos.request.weight;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;
import java.time.LocalDate;

@Data
public class LogWeightRequest {

    @NotNull
    @Positive
    private Float weightKg;

    private LocalDate date;
}