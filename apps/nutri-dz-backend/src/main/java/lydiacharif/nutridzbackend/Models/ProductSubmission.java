package lydiacharif.nutridzbackend.Models;

import lombok.*;
import lydiacharif.nutridzbackend.Enums.FoodCategory;
import lydiacharif.nutridzbackend.Enums.NutritionalScore;
import lydiacharif.nutridzbackend.Enums.SubmissionStatus;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductSubmission {
    private Long id;
    private String barcode;
    private String codeFormat;
    private String name;
    private String nameAr;
    private String brand;
    private FoodCategory category;
    private Float caloriesPer100g;
    private Float proteinPer100g;
    private Float carbsPer100g;
    private Float fatPer100g;
    private Float fiberPer100g;
    private Float sugarPer100g;
    private Float saltPer100g;
    private NutritionalScore nutritionalScore;
    /** JSON array of {label, grams}. */
    private String servingSizesJson;
    /** data:image/...;base64,... */
    private String productImage;
    private String labelImage;
    private String ocrText;
    private SubmissionStatus status;
    private String rejectReason;
    private Long targetFoodId;
    private Long foodId;
    private Long submittedBy;
    private String submittedByName;
    private Long reviewedBy;
    private String reviewedByName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime reviewedAt;
}
