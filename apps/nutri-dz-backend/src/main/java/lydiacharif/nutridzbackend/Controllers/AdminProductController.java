package lydiacharif.nutridzbackend.Controllers;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lydiacharif.nutridzbackend.Dtos.request.admin.ProductSubmissionRequest;
import lydiacharif.nutridzbackend.Dtos.request.admin.RejectRequest;
import lydiacharif.nutridzbackend.Dtos.response.admin.*;
import lydiacharif.nutridzbackend.Enums.FoodCategory;
import lydiacharif.nutridzbackend.Enums.SubmissionStatus;
import lydiacharif.nutridzbackend.Security.CustomUserPrincipal;
import lydiacharif.nutridzbackend.Services.AdminProductService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/** Admin data-collection API. Access restricted to ROLE_ADMIN in SecurityConfig. */
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearer-jwt")
@Tag(name = "Admin — products", description = "Scan, review and approve products for the food database")
public class AdminProductController {

    private final AdminProductService service;

    @Operation(summary = "Dashboard numbers")
    @GetMapping("/stats")
    public AdminStatsResponse stats() {
        return service.stats();
    }

    @Operation(summary = "Check whether a barcode already exists or is pending")
    @GetMapping("/barcode/{code}")
    public BarcodeCheckResponse checkBarcode(@PathVariable String code) {
        return service.checkBarcode(code);
    }

    // ── Submissions ──

    @Operation(summary = "Submit a scanned product for review")
    @PostMapping("/submissions")
    public ResponseEntity<SubmissionResponse> create(
            @AuthenticationPrincipal CustomUserPrincipal principal,
            @Valid @RequestBody ProductSubmissionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(service.createSubmission(principal.user().getId(), request));
    }

    @Operation(summary = "List submissions (label photos omitted)")
    @GetMapping("/submissions")
    public PageResponse<SubmissionResponse> list(
            @RequestParam(required = false) SubmissionStatus status,
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return service.listSubmissions(status, q, page, size);
    }

    @Operation(summary = "Submission detail, including the label photo")
    @GetMapping("/submissions/{id}")
    public SubmissionResponse get(@PathVariable Long id) {
        return service.getSubmission(id);
    }

    @Operation(summary = "Edit a pending submission")
    @PutMapping("/submissions/{id}")
    public SubmissionResponse update(@PathVariable Long id, @Valid @RequestBody ProductSubmissionRequest request) {
        return service.updateSubmission(id, request);
    }

    @Operation(summary = "Approve — publishes the product to the app (body = optional final edits)")
    @PostMapping("/submissions/{id}/approve")
    public SubmissionResponse approve(
            @AuthenticationPrincipal CustomUserPrincipal principal,
            @PathVariable Long id,
            @Valid @RequestBody(required = false) ProductSubmissionRequest edits) {
        return service.approve(id, principal.user().getId(), edits);
    }

    @Operation(summary = "Reject with a reason")
    @PostMapping("/submissions/{id}/reject")
    public SubmissionResponse reject(
            @AuthenticationPrincipal CustomUserPrincipal principal,
            @PathVariable Long id,
            @Valid @RequestBody RejectRequest request) {
        return service.reject(id, principal.user().getId(), request.getReason());
    }

    @Operation(summary = "Send a rejected submission back to the queue")
    @PostMapping("/submissions/{id}/reopen")
    public SubmissionResponse reopen(@PathVariable Long id) {
        return service.reopen(id);
    }

    @Operation(summary = "Delete a pending or rejected submission")
    @DeleteMapping("/submissions/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.deleteSubmission(id);
        return ResponseEntity.noContent().build();
    }

    // ── Foods ──

    @Operation(summary = "Browse the food database")
    @GetMapping("/foods")
    public PageResponse<AdminFoodResponse> foods(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) FoodCategory category,
            @RequestParam(required = false) Boolean verified,
            @RequestParam(required = false) Boolean hasBarcode,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return service.listFoods(q, category, verified, hasBarcode, page, size);
    }

    @GetMapping("/foods/{id}")
    public AdminFoodResponse food(@PathVariable Long id) {
        return service.getFood(id);
    }

    @Operation(summary = "Edit a food already in the app")
    @PutMapping("/foods/{id}")
    public AdminFoodResponse updateFood(@PathVariable Long id, @Valid @RequestBody ProductSubmissionRequest request) {
        return service.updateFood(id, request);
    }

    @Operation(summary = "Mark a food verified / unverified")
    @PatchMapping("/foods/{id}/verified")
    public AdminFoodResponse setVerified(@PathVariable Long id, @RequestBody Map<String, Boolean> body) {
        return service.setVerified(id, Boolean.TRUE.equals(body.get("verified")));
    }
}
