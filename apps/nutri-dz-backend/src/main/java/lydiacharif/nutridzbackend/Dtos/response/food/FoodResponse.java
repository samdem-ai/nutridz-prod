package lydiacharif.nutridzbackend.Dtos.response.food;

import lombok.*;
import lydiacharif.nutridzbackend.Enums.*;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FoodResponse {
    private Long id;
    private String name;
    private String nameAr;
    private FoodCategory category;
    private FoodSource source;
    private Float caloriesPer100g;
    private Float proteinPer100g;
    private Float carbsPer100g;
    private Float fatPer100g;
    private Float fiberPer100g;
    private Float sugarPer100g;
    private Float saltPer100g;
    private NutritionalScore nutritionalScore;
    private String barcode;
    private String imageUrl;
    private Boolean verified;
    private List<ServingSizeResponse> servingSizes;
}