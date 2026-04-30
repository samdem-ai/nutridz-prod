package lydiacharif.nutridzbackend.Models;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MealPlan {
    private Long id;
    private Long userId;
    private LocalDate startDate;
    private LocalDate endDate;
    private Integer durationDays;
    private LocalDateTime generatedAt;
}