package lydiacharif.nutridzbackend.Dtos.request.admin;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.*;
import lydiacharif.nutridzbackend.Enums.FoodCategory;
import lydiacharif.nutridzbackend.Enums.NutritionalScore;

import java.util.List;

/** Body for creating/editing a submission and for editing an existing food. */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductSubmissionRequest {

    @Size(max = 50) @Pattern(regexp = "^[\\x20-\\x7E]*$", message = "Barcode must be printable ASCII")
    private String barcode;
    @Size(max = 20)
    private String codeFormat;

    @NotBlank(message = "Name is required") @Size(max = 200)
    private String name;
    @Size(max = 200)
    private String nameAr;
    @Size(max = 120)
    private String brand;

    @NotNull(message = "Category is required")
    private FoodCategory category;

    @NotNull(message = "Calories are required") @PositiveOrZero @Max(900)
    private Float caloriesPer100g;
    @PositiveOrZero @Max(100) private Float proteinPer100g;
    @PositiveOrZero @Max(100) private Float carbsPer100g;
    @PositiveOrZero @Max(100) private Float fatPer100g;
    @PositiveOrZero @Max(100) private Float fiberPer100g;
    @PositiveOrZero @Max(100) private Float sugarPer100g;
    @PositiveOrZero @Max(100) private Float saltPer100g;

    private NutritionalScore nutritionalScore;

    @Valid @Size(max = 10)
    private List<ServingSizeDto> servingSizes;

    /** data:image/jpeg;base64,... — null keeps the current image on edit. */
    @Size(max = 400_000, message = "Product image too large")
    private String productImage;
    @Size(max = 3_000_000, message = "Label image too large")
    private String labelImage;
    @Size(max = 20_000)
    private String ocrText;

    /** When set, approving updates this existing food instead of creating one. */
    private Long targetFoodId;
}
