package lydiacharif.nutridzbackend.Dtos.response.admin;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BarcodeCheckResponse {
    private String barcode;
    /** Food already in the app with this code, if any. */
    private AdminFoodResponse existingFood;
    /** Id of a pending submission with this code, if any. */
    private Long pendingSubmissionId;
}
