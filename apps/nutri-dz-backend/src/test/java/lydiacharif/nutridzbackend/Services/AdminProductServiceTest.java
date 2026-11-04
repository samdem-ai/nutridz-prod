package lydiacharif.nutridzbackend.Services;

import lydiacharif.nutridzbackend.Dtos.request.admin.ProductSubmissionRequest;
import lydiacharif.nutridzbackend.Dtos.request.admin.ServingSizeDto;
import lydiacharif.nutridzbackend.Enums.FoodCategory;
import lydiacharif.nutridzbackend.Enums.FoodSource;
import lydiacharif.nutridzbackend.Enums.SubmissionStatus;
import lydiacharif.nutridzbackend.Exceptions.InvalidRequestException;
import lydiacharif.nutridzbackend.Exceptions.ResourceAlreadyExistsException;
import lydiacharif.nutridzbackend.Models.Food;
import lydiacharif.nutridzbackend.Models.FoodServingSize;
import lydiacharif.nutridzbackend.Models.ProductSubmission;
import lydiacharif.nutridzbackend.Repositories.AdminFoodRepository;
import lydiacharif.nutridzbackend.Repositories.FoodRepository;
import lydiacharif.nutridzbackend.Repositories.ProductSubmissionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminProductServiceTest {

    // 1x1 transparent PNG
    private static final String PNG =
            "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

    @Mock private ProductSubmissionRepository submissionRepository;
    @Mock private FoodRepository foodRepository;
    @Mock private AdminFoodRepository adminFoodRepository;
    @InjectMocks private AdminProductService service;

    /** Simulates the submissions table holding a single row. */
    private final AtomicReference<ProductSubmission> stored = new AtomicReference<>();

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(service, "baseUrl", "https://api.example.com/");
        lenient().when(submissionRepository.save(any())).thenAnswer(inv -> {
            ProductSubmission s = inv.getArgument(0);
            if (s.getId() == null) s.setId(7L);
            stored.set(s);
            return s;
        });
        lenient().when(submissionRepository.findById(7L)).thenAnswer(inv -> Optional.ofNullable(stored.get()));
    }

    private ProductSubmissionRequest request(String barcode) {
        return ProductSubmissionRequest.builder()
                .barcode(barcode)
                .codeFormat("EAN_13")
                .name("  Selecto 1L ")
                .brand("Hamoud Boualem")
                .category(FoodCategory.PACKAGED_PRODUCT)
                .caloriesPer100g(42f)
                .sugarPer100g(10.5f)
                .productImage(PNG)
                .build();
    }

    @Test
    void createSubmission_linksToExistingFoodWithSameBarcode() {
        when(submissionRepository.findPendingByBarcode("6130001")).thenReturn(Optional.empty());
        Food existing = Food.builder().id(55L).barcode("6130001").build();
        when(foodRepository.findByBarcode("6130001")).thenReturn(Optional.of(existing));
        when(foodRepository.findById(55L)).thenReturn(Optional.of(existing));

        var res = service.createSubmission(1L, request(" 6130001 "));

        assertEquals(SubmissionStatus.PENDING, res.getStatus());
        assertEquals("6130001", res.getBarcode());
        assertEquals("Selecto 1L", res.getName());
        assertEquals(55L, res.getTargetFoodId());
    }

    @Test
    void createSubmission_rejectsDuplicatePendingBarcode() {
        when(submissionRepository.findPendingByBarcode("6130001"))
                .thenReturn(Optional.of(ProductSubmission.builder().id(3L).build()));
        assertThrows(ResourceAlreadyExistsException.class,
                () -> service.createSubmission(1L, request("6130001")));
        verify(submissionRepository, never()).save(any());
    }

    @Test
    void createSubmission_rejectsNonImageDataUri() {
        when(submissionRepository.findPendingByBarcode(any())).thenReturn(Optional.empty());
        when(foodRepository.findByBarcode(any())).thenReturn(Optional.empty());
        ProductSubmissionRequest req = request("1");
        req.setProductImage("data:text/html;base64,PGgxPg==");
        assertThrows(InvalidRequestException.class, () -> service.createSubmission(1L, req));
    }

    @Test
    void approve_createsVerifiedFoodWithDefaultServingAndImageUrl() {
        stored.set(ProductSubmission.builder()
                .id(7L).status(SubmissionStatus.PENDING).barcode("6130001")
                .name("Selecto 1L").category(FoodCategory.PACKAGED_PRODUCT)
                .caloriesPer100g(42f).productImage(PNG).submittedBy(1L)
                .build());
        when(foodRepository.findByBarcode("6130001")).thenReturn(Optional.empty());
        when(foodRepository.save(any())).thenAnswer(inv -> {
            Food f = inv.getArgument(0);
            if (f.getId() == null) f.setId(99L);
            return f;
        });

        var res = service.approve(7L, 2L, null);

        ArgumentCaptor<Food> food = ArgumentCaptor.forClass(Food.class);
        verify(foodRepository, atLeastOnce()).save(food.capture());
        Food saved = food.getValue();
        assertTrue(saved.getVerified());
        assertEquals(FoodSource.MANUAL, saved.getSource());
        assertEquals("6130001", saved.getBarcode());
        assertTrue(saved.getImageUrl().startsWith("https://api.example.com/api/public/food-images/99?v="));

        ArgumentCaptor<FoodServingSize> serving = ArgumentCaptor.forClass(FoodServingSize.class);
        verify(foodRepository).saveServingSize(serving.capture());
        assertEquals(100f, serving.getValue().getGrams());
        verify(adminFoodRepository).saveImage(eq(99L), eq("image/png"), any());

        assertEquals(SubmissionStatus.APPROVED, res.getStatus());
        assertEquals(99L, res.getFoodId());
        assertEquals(2L, res.getReviewedBy());
    }

    @Test
    void approve_updatesTargetFoodAndReplacesServingSizes() {
        Food existing = Food.builder().id(55L).name("Old").source(FoodSource.OPEN_FOOD_FACTS)
                .category(FoodCategory.PACKAGED_PRODUCT).barcode("6130001").verified(false).build();
        stored.set(ProductSubmission.builder()
                .id(7L).status(SubmissionStatus.PENDING).barcode("6130001").targetFoodId(55L)
                .name("New").category(FoodCategory.PACKAGED_PRODUCT).caloriesPer100g(42f)
                .servingSizesJson("[{\"label\":\"1 bouteille\",\"grams\":330}]")
                .build());
        when(foodRepository.findById(55L)).thenReturn(Optional.of(existing));
        when(foodRepository.findByBarcode("6130001")).thenReturn(Optional.of(existing));

        service.approve(7L, 2L, null);

        assertEquals("New", existing.getName());
        assertTrue(existing.getVerified());
        assertEquals(FoodSource.OPEN_FOOD_FACTS, existing.getSource());
        verify(adminFoodRepository).deleteServingSizes(55L);
        verify(foodRepository).saveServingSize(argThat(s -> s.getGrams() == 330f && s.getLabel().equals("1 bouteille")));
    }

    @Test
    void approve_failsWhenBarcodeBelongsToAnotherFood() {
        stored.set(ProductSubmission.builder()
                .id(7L).status(SubmissionStatus.PENDING).barcode("6130001")
                .name("X").category(FoodCategory.PACKAGED_PRODUCT).caloriesPer100g(1f).build());
        when(foodRepository.findByBarcode("6130001"))
                .thenReturn(Optional.of(Food.builder().id(12L).build()));

        assertThrows(ResourceAlreadyExistsException.class, () -> service.approve(7L, 2L, null));
        verify(foodRepository, never()).save(any());
    }

    @Test
    void reject_requiresPendingAndStoresReason() {
        stored.set(ProductSubmission.builder().id(7L).status(SubmissionStatus.PENDING)
                .name("X").category(FoodCategory.PACKAGED_PRODUCT).build());

        var res = service.reject(7L, 2L, "  blurry label ");
        assertEquals(SubmissionStatus.REJECTED, res.getStatus());
        assertEquals("blurry label", res.getRejectReason());

        assertThrows(InvalidRequestException.class, () -> service.reject(7L, 2L, "again"));
    }

    @Test
    void servingSizesRoundTripThroughJson() {
        when(submissionRepository.findPendingByBarcode(any())).thenReturn(Optional.empty());
        when(foodRepository.findByBarcode(any())).thenReturn(Optional.empty());
        ProductSubmissionRequest req = request("42");
        req.setServingSizes(List.of(new ServingSizeDto("1 pot", 125f)));

        var res = service.createSubmission(1L, req);
        assertEquals(1, res.getServingSizes().size());
        assertEquals(125f, res.getServingSizes().get(0).getGrams());
    }
}
