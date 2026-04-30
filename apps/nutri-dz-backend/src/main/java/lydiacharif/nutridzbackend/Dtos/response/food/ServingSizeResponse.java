package lydiacharif.nutridzbackend.Dtos.response.food;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ServingSizeResponse {
    private Long id;
    private String label;
    private Float grams;
    private Float calories;
    private Float protein;
    private Float carbs;
    private Float fat;
}