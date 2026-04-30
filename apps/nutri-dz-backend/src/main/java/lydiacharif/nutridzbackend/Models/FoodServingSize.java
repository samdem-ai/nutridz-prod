package lydiacharif.nutridzbackend.Models;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FoodServingSize {
    private Long id;
    private Long foodId;
    private String label;
    private Float grams;
}