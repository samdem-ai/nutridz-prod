package lydiacharif.nutridzbackend.Models;

import lombok.*;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WeightLog {
    private Long id;
    private Long userId;
    private Float weightKg;
    private Float bmi;
    private LocalDate recordedOn;
}