package lydiacharif.nutridzbackend.Dtos.response.weight;

import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WeightLogResponse {

    private Long id;
    private Float weightKg;
    private Float bmi;
    private LocalDate recordedOn;
    private LocalDateTime createdAt;
}