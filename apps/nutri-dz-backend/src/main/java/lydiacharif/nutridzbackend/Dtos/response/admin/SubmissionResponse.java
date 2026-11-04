package lydiacharif.nutridzbackend.Dtos.response.admin;

import lombok.*;
import lydiacharif.nutridzbackend.Dtos.request.admin.ServingSizeDto;
import lydiacharif.nutridzbackend.Enums.FoodCategory;
import lydiacharif.nutridzbackend.Enums.NutritionalScore;
import lydiacharif.nutridzbackend.Enums.SubmissionStatus;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubmissionResponse {
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
    private List<ServingSizeDto> servingSizes;
    private String productImage;
    /** Only filled on the detail endpoint. */
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
