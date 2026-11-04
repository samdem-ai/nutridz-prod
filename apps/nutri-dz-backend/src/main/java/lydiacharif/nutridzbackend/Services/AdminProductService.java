package lydiacharif.nutridzbackend.Services;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import lydiacharif.nutridzbackend.Dtos.request.admin.ProductSubmissionRequest;
import lydiacharif.nutridzbackend.Dtos.request.admin.ServingSizeDto;
import lydiacharif.nutridzbackend.Dtos.response.admin.*;
import lydiacharif.nutridzbackend.Enums.FoodCategory;
import lydiacharif.nutridzbackend.Enums.FoodSource;
import lydiacharif.nutridzbackend.Enums.SubmissionStatus;
import lydiacharif.nutridzbackend.Exceptions.InvalidRequestException;
import lydiacharif.nutridzbackend.Exceptions.ResourceAlreadyExistsException;
import lydiacharif.nutridzbackend.Exceptions.ResourceNotFoundException;
import lydiacharif.nutridzbackend.Models.Food;
import lydiacharif.nutridzbackend.Models.FoodServingSize;
import lydiacharif.nutridzbackend.Models.ProductSubmission;
import lydiacharif.nutridzbackend.Repositories.AdminFoodRepository;
import lydiacharif.nutridzbackend.Repositories.FoodRepository;
import lydiacharif.nutridzbackend.Repositories.ProductSubmissionRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Admin data-collection workflow: scanned products are stored as PENDING
 * submissions and only written to the `foods` table (which the mobile app
 * reads) when an admin approves them.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AdminProductService {

    private static final Pattern DATA_URI = Pattern.compile("^data:(image/(?:jpeg|png|webp));base64,(.+)$", Pattern.DOTALL);
    private static final int MAX_PAGE_SIZE = 100;

    private final ProductSubmissionRepository submissionRepository;
    private final FoodRepository foodRepository;
    private final AdminFoodRepository adminFoodRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${app.base-url:http://localhost:8080}")
    private String baseUrl;

    // ── Barcode lookup ─────────────────────────────────────────────

    public BarcodeCheckResponse checkBarcode(String rawBarcode) {
        String barcode = normalizeBarcode(rawBarcode);
        if (barcode == null) throw new InvalidRequestException("Barcode is empty");
        return BarcodeCheckResponse.builder()
                .barcode(barcode)
                .existingFood(foodRepository.findByBarcode(barcode).map(this::toFoodResponse).orElse(null))
                .pendingSubmissionId(submissionRepository.findPendingByBarcode(barcode)
                        .map(ProductSubmission::getId).orElse(null))
                .build();
    }

    // ── Submissions ────────────────────────────────────────────────

    @Transactional
    public SubmissionResponse createSubmission(Long userId, ProductSubmissionRequest req) {
        String barcode = normalizeBarcode(req.getBarcode());
        Long targetFoodId = req.getTargetFoodId();

        if (barcode != null) {
            submissionRepository.findPendingByBarcode(barcode).ifPresent(p -> {
                throw new ResourceAlreadyExistsException("Pending submission", "barcode", barcode);
            });
            if (targetFoodId == null) {
                targetFoodId = foodRepository.findByBarcode(barcode).map(Food::getId).orElse(null);
            }
        }
        if (targetFoodId != null && foodRepository.findById(targetFoodId).isEmpty()) {
            throw new ResourceNotFoundException("Food", targetFoodId);
        }

        ProductSubmission s = ProductSubmission.builder()
                .status(SubmissionStatus.PENDING)
                .submittedBy(userId)
                .targetFoodId(targetFoodId)
                .build();
        applyRequest(s, req);
        s.setBarcode(barcode);
        submissionRepository.save(s);
        log.info("Admin {} submitted product '{}' (barcode {})", userId, s.getName(), barcode);
        return getSubmission(s.getId());
    }

    public PageResponse<SubmissionResponse> listSubmissions(SubmissionStatus status, String q, int page, int size) {
        int pageSize = clampSize(size);
        int pageIndex = Math.max(page, 0);
        List<SubmissionResponse> items = submissionRepository
                .search(status, q, pageSize, pageIndex * pageSize)
                .stream().map(this::toSubmissionResponse).toList();
        return PageResponse.<SubmissionResponse>builder()
                .items(items)
                .total(submissionRepository.count(status, q))
                .page(pageIndex)
                .size(pageSize)
                .build();
    }

    public SubmissionResponse getSubmission(Long id) {
        return toSubmissionResponse(findSubmission(id));
    }

    @Transactional
    public SubmissionResponse updateSubmission(Long id, ProductSubmissionRequest req) {
        ProductSubmission s = findPending(id);
        String barcode = normalizeBarcode(req.getBarcode());
        if (barcode != null && !barcode.equals(s.getBarcode())) {
            submissionRepository.findPendingByBarcode(barcode).ifPresent(p -> {
                if (!p.getId().equals(id)) {
                    throw new ResourceAlreadyExistsException("Pending submission", "barcode", barcode);
                }
            });
        }
        applyRequest(s, req);
        s.setBarcode(barcode);
        if (req.getTargetFoodId() != null) s.setTargetFoodId(req.getTargetFoodId());
        submissionRepository.save(s);
        return getSubmission(id);
    }

    /** Approve, optionally applying last-minute edits from the review screen. */
    @Transactional
    public SubmissionResponse approve(Long id, Long reviewerId, ProductSubmissionRequest edits) {
        if (edits != null) updateSubmission(id, edits);
        ProductSubmission s = findPending(id);

        Food food = s.getTargetFoodId() != null
                ? foodRepository.findById(s.getTargetFoodId())
                    .orElseThrow(() -> new ResourceNotFoundException("Food", s.getTargetFoodId()))
                : Food.builder().source(FoodSource.MANUAL).build();
        boolean isNew = food.getId() == null;

        if (s.getBarcode() != null) {
            foodRepository.findByBarcode(s.getBarcode()).ifPresent(other -> {
                if (!other.getId().equals(food.getId())) {
                    throw new ResourceAlreadyExistsException("Food", "barcode", s.getBarcode());
                }
            });
        }

        food.setName(s.getName());
        food.setNameAr(s.getNameAr());
        food.setBrand(s.getBrand());
        food.setCategory(s.getCategory());
        food.setCaloriesPer100g(s.getCaloriesPer100g());
        food.setProteinPer100g(s.getProteinPer100g());
        food.setCarbsPer100g(s.getCarbsPer100g());
        food.setFatPer100g(s.getFatPer100g());
        food.setFiberPer100g(s.getFiberPer100g());
        food.setSugarPer100g(s.getSugarPer100g());
        food.setSaltPer100g(s.getSaltPer100g());
        food.setNutritionalScore(s.getNutritionalScore());
        if (s.getBarcode() != null) food.setBarcode(s.getBarcode());
        if (food.getSource() == null) food.setSource(FoodSource.MANUAL);
        food.setVerified(true);
        foodRepository.save(food);

        List<ServingSizeDto> sizes = parseServingSizes(s.getServingSizesJson());
        if (!sizes.isEmpty()) {
            replaceServingSizes(food.getId(), sizes);
        } else if (isNew) {
            replaceServingSizes(food.getId(), List.of(new ServingSizeDto("100 g", 100f)));
        }

        if (s.getProductImage() != null) {
            storeImage(food, s.getProductImage());
            foodRepository.save(food);
        }

        s.setStatus(SubmissionStatus.APPROVED);
        s.setFoodId(food.getId());
        s.setReviewedBy(reviewerId);
        s.setReviewedAt(LocalDateTime.now());
        s.setRejectReason(null);
        submissionRepository.save(s);
        log.info("Admin {} approved submission {} -> food {}", reviewerId, id, food.getId());
        return getSubmission(id);
    }

    @Transactional
    public SubmissionResponse reject(Long id, Long reviewerId, String reason) {
        ProductSubmission s = findPending(id);
        s.setStatus(SubmissionStatus.REJECTED);
        s.setRejectReason(reason.trim());
        s.setReviewedBy(reviewerId);
        s.setReviewedAt(LocalDateTime.now());
        submissionRepository.save(s);
        return getSubmission(id);
    }

    /** Put a rejected submission back in the queue (e.g. after fixing it). */
    @Transactional
    public SubmissionResponse reopen(Long id) {
        ProductSubmission s = findSubmission(id);
        if (s.getStatus() != SubmissionStatus.REJECTED) {
            throw new InvalidRequestException("Only rejected submissions can be reopened");
        }
        if (s.getBarcode() != null) {
            submissionRepository.findPendingByBarcode(s.getBarcode()).ifPresent(p -> {
                throw new ResourceAlreadyExistsException("Pending submission", "barcode", s.getBarcode());
            });
        }
        s.setStatus(SubmissionStatus.PENDING);
        s.setReviewedBy(null);
        s.setReviewedAt(null);
        submissionRepository.save(s);
        return getSubmission(id);
    }

    @Transactional
    public void deleteSubmission(Long id) {
        ProductSubmission s = findSubmission(id);
        if (s.getStatus() == SubmissionStatus.APPROVED) {
            throw new InvalidRequestException("Approved submissions are kept as history");
        }
        submissionRepository.deleteById(id);
    }

    // ── Foods (what the app shows) ─────────────────────────────────

    public PageResponse<AdminFoodResponse> listFoods(String q, FoodCategory category, Boolean verified,
                                                     Boolean hasBarcode, int page, int size) {
        int pageSize = clampSize(size);
        int pageIndex = Math.max(page, 0);
        List<AdminFoodResponse> items = adminFoodRepository
                .searchIds(q, category, verified, hasBarcode, pageSize, pageIndex * pageSize)
                .stream()
                .map(foodRepository::findById)
                .flatMap(Optional::stream)
                .map(this::toFoodResponse)
                .toList();
        return PageResponse.<AdminFoodResponse>builder()
                .items(items)
                .total(adminFoodRepository.count(q, category, verified, hasBarcode))
                .page(pageIndex)
                .size(pageSize)
                .build();
    }

    public AdminFoodResponse getFood(Long id) {
        return toFoodResponse(findFood(id));
    }

    /** Direct edit of a food that is already in the app. */
    @Transactional
    public AdminFoodResponse updateFood(Long id, ProductSubmissionRequest req) {
        Food food = findFood(id);
        String barcode = normalizeBarcode(req.getBarcode());
        if (barcode != null) {
            foodRepository.findByBarcode(barcode).ifPresent(other -> {
                if (!other.getId().equals(id)) throw new ResourceAlreadyExistsException("Food", "barcode", barcode);
            });
        }
        food.setName(req.getName().trim());
        food.setNameAr(blankToNull(req.getNameAr()));
        food.setBrand(blankToNull(req.getBrand()));
        food.setCategory(req.getCategory());
        food.setCaloriesPer100g(req.getCaloriesPer100g());
        food.setProteinPer100g(req.getProteinPer100g());
        food.setCarbsPer100g(req.getCarbsPer100g());
        food.setFatPer100g(req.getFatPer100g());
        food.setFiberPer100g(req.getFiberPer100g());
        food.setSugarPer100g(req.getSugarPer100g());
        food.setSaltPer100g(req.getSaltPer100g());
        food.setNutritionalScore(req.getNutritionalScore());
        food.setBarcode(barcode);
        if (req.getProductImage() != null) storeImage(food, req.getProductImage());
        foodRepository.save(food);
        if (req.getServingSizes() != null) replaceServingSizes(id, req.getServingSizes());
        return getFood(id);
    }

    @Transactional
    public AdminFoodResponse setVerified(Long id, boolean verified) {
        Food food = findFood(id);
        food.setVerified(verified);
        foodRepository.save(food);
        return toFoodResponse(food);
    }

    public Optional<AdminFoodRepository.StoredImage> getFoodImage(Long foodId) {
        return adminFoodRepository.findImage(foodId);
    }

    // ── Stats ──────────────────────────────────────────────────────

    public AdminStatsResponse stats() {
        List<AdminStatsResponse.ContributorStat> contributors = submissionRepository.contributorStats().stream()
                .map(row -> AdminStatsResponse.ContributorStat.builder()
                        .userId((Long) row[0])
                        .username((String) row[1])
                        .submitted(row[2] != null ? (Long) row[2] : 0)
                        .approved(row[3] != null ? (Long) row[3] : 0)
                        .build())
                .toList();
        return AdminStatsResponse.builder()
                .totalFoods(adminFoodRepository.count(null, null, null, null))
                .verifiedFoods(adminFoodRepository.count(null, null, true, null))
                .foodsWithBarcode(adminFoodRepository.count(null, null, null, true))
                .pending(submissionRepository.countByStatus(SubmissionStatus.PENDING))
                .approved(submissionRepository.countByStatus(SubmissionStatus.APPROVED))
                .rejected(submissionRepository.countByStatus(SubmissionStatus.REJECTED))
                .submittedToday(submissionRepository.countCreatedSince(LocalDate.now()))
                .foodsByCategory(adminFoodRepository.countByCategory())
                .contributors(contributors)
                .build();
    }

    // ── Helpers ────────────────────────────────────────────────────

    private void applyRequest(ProductSubmission s, ProductSubmissionRequest req) {
        s.setCodeFormat(blankToNull(req.getCodeFormat()));
        s.setName(req.getName().trim());
        s.setNameAr(blankToNull(req.getNameAr()));
        s.setBrand(blankToNull(req.getBrand()));
        s.setCategory(req.getCategory());
        s.setCaloriesPer100g(req.getCaloriesPer100g());
        s.setProteinPer100g(req.getProteinPer100g());
        s.setCarbsPer100g(req.getCarbsPer100g());
        s.setFatPer100g(req.getFatPer100g());
        s.setFiberPer100g(req.getFiberPer100g());
        s.setSugarPer100g(req.getSugarPer100g());
        s.setSaltPer100g(req.getSaltPer100g());
        s.setNutritionalScore(req.getNutritionalScore());
        if (req.getServingSizes() != null) s.setServingSizesJson(writeServingSizes(req.getServingSizes()));
        if (req.getProductImage() != null) {
            decodeImage(req.getProductImage()); // validates
            s.setProductImage(req.getProductImage());
        }
        if (req.getLabelImage() != null) {
            decodeImage(req.getLabelImage());
            s.setLabelImage(req.getLabelImage());
        }
        if (req.getOcrText() != null) s.setOcrText(req.getOcrText());
    }

    private void replaceServingSizes(Long foodId, List<ServingSizeDto> sizes) {
        adminFoodRepository.deleteServingSizes(foodId);
        for (ServingSizeDto dto : sizes) {
            foodRepository.saveServingSize(FoodServingSize.builder()
                    .foodId(foodId)
                    .label(dto.getLabel().trim())
                    .grams(dto.getGrams())
                    .build());
        }
    }

    private void storeImage(Food food, String dataUri) {
        DecodedImage img = decodeImage(dataUri);
        adminFoodRepository.saveImage(food.getId(), img.mimeType(), img.bytes());
        String base = baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
        food.setImageUrl(base + "/api/public/food-images/" + food.getId() + "?v=" + System.currentTimeMillis());
    }

    record DecodedImage(String mimeType, byte[] bytes) {}

    static DecodedImage decodeImage(String dataUri) {
        Matcher m = DATA_URI.matcher(dataUri.trim());
        if (!m.matches()) throw new InvalidRequestException("Images must be JPEG, PNG or WebP data URIs");
        try {
            return new DecodedImage(m.group(1), Base64.getDecoder().decode(m.group(2).replaceAll("\\s", "")));
        } catch (IllegalArgumentException e) {
            throw new InvalidRequestException("Image is not valid base64");
        }
    }

    private String writeServingSizes(List<ServingSizeDto> sizes) {
        try {
            return objectMapper.writeValueAsString(sizes);
        } catch (Exception e) {
            throw new InvalidRequestException("Invalid serving sizes");
        }
    }

    private List<ServingSizeDto> parseServingSizes(String json) {
        if (json == null || json.isBlank()) return List.of();
        try {
            return objectMapper.readValue(json, new TypeReference<List<ServingSizeDto>>() {});
        } catch (Exception e) {
            log.warn("Could not parse serving sizes: {}", json);
            return List.of();
        }
    }

    static String normalizeBarcode(String raw) {
        if (raw == null) return null;
        String trimmed = raw.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }

    private static int clampSize(int size) {
        return Math.min(Math.max(size, 1), MAX_PAGE_SIZE);
    }

    private ProductSubmission findSubmission(Long id) {
        return submissionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Submission", id));
    }

    private ProductSubmission findPending(Long id) {
        ProductSubmission s = findSubmission(id);
        if (s.getStatus() != SubmissionStatus.PENDING) {
            throw new InvalidRequestException("Submission " + id + " is already " + s.getStatus());
        }
        return s;
    }

    private Food findFood(Long id) {
        return foodRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Food", id));
    }

    private SubmissionResponse toSubmissionResponse(ProductSubmission s) {
        return SubmissionResponse.builder()
                .id(s.getId())
                .barcode(s.getBarcode())
                .codeFormat(s.getCodeFormat())
                .name(s.getName())
                .nameAr(s.getNameAr())
                .brand(s.getBrand())
                .category(s.getCategory())
                .caloriesPer100g(s.getCaloriesPer100g())
                .proteinPer100g(s.getProteinPer100g())
                .carbsPer100g(s.getCarbsPer100g())
                .fatPer100g(s.getFatPer100g())
                .fiberPer100g(s.getFiberPer100g())
                .sugarPer100g(s.getSugarPer100g())
                .saltPer100g(s.getSaltPer100g())
                .nutritionalScore(s.getNutritionalScore())
                .servingSizes(parseServingSizes(s.getServingSizesJson()))
                .productImage(s.getProductImage())
                .labelImage(s.getLabelImage())
                .ocrText(s.getOcrText())
                .status(s.getStatus())
                .rejectReason(s.getRejectReason())
                .targetFoodId(s.getTargetFoodId())
                .foodId(s.getFoodId())
                .submittedBy(s.getSubmittedBy())
                .submittedByName(s.getSubmittedByName())
                .reviewedBy(s.getReviewedBy())
                .reviewedByName(s.getReviewedByName())
                .createdAt(s.getCreatedAt())
                .updatedAt(s.getUpdatedAt())
                .reviewedAt(s.getReviewedAt())
                .build();
    }

    private AdminFoodResponse toFoodResponse(Food f) {
        List<ServingSizeDto> sizes = foodRepository.findServingSizesByFoodId(f.getId()).stream()
                .map(s -> new ServingSizeDto(s.getLabel(), s.getGrams()))
                .toList();
        return AdminFoodResponse.builder()
                .id(f.getId())
                .name(f.getName())
                .nameAr(f.getNameAr())
                .brand(f.getBrand())
                .category(f.getCategory())
                .source(f.getSource())
                .caloriesPer100g(f.getCaloriesPer100g())
                .proteinPer100g(f.getProteinPer100g())
                .carbsPer100g(f.getCarbsPer100g())
                .fatPer100g(f.getFatPer100g())
                .fiberPer100g(f.getFiberPer100g())
                .sugarPer100g(f.getSugarPer100g())
                .saltPer100g(f.getSaltPer100g())
                .nutritionalScore(f.getNutritionalScore())
                .barcode(f.getBarcode())
                .imageUrl(f.getImageUrl())
                .verified(f.getVerified())
                .servingSizes(sizes)
                .build();
    }
}
