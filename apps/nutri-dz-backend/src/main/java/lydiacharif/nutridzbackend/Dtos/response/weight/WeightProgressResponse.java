package lydiacharif.nutridzbackend.Dtos.response.weight;

import lombok.*;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WeightProgressResponse {

    private Float currentWeight;
    private Float startingWeight;
    private Float currentBmi;
    private Float weightChange; 
    private List<WeightLogResponse> history;
}