package lydiacharif.nutridzbackend.Models;

import lombok.*;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HydrationLog {
    private Long id;
    private Long userId;
    private LocalDate date;
    private Float totalMl;
}