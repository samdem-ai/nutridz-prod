package lydiacharif.nutridzbackend.Dtos.response.hydration;

import lombok.*;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HydrationResponse {

    private LocalDate date;
    private Float totalMl;
    private Float targetMl;
    private Integer glassCount;
    private Float progressPercent;
}