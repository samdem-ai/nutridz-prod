package lydiacharif.nutridzbackend.Dtos.response.admin;

import lombok.*;
import lydiacharif.nutridzbackend.Dtos.request.admin.ServingSizeDto;
import lydiacharif.nutridzbackend.Enums.FoodCategory;
import lydiacharif.nutridzbackend.Enums.FoodSource;
import lydiacharif.nutridzbackend.Enums.NutritionalScore;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminFoodResponse {
    private Long id;
    private String name;
    private String nameAr;
    private String brand;
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
    private List<ServingSizeDto> servingSizes;
}
