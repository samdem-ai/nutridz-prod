package lydiacharif.nutridzbackend.Controllers;

import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lydiacharif.nutridzbackend.Services.AdminProductService;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import java.util.concurrent.TimeUnit;

/** Serves approved product photos so foods.image_url can be a plain URL. */
@RestController
@RequiredArgsConstructor
@Tag(name = "Public")
public class PublicImageController {

    private final AdminProductService service;

    @GetMapping("/api/public/food-images/{foodId}")
    public ResponseEntity<byte[]> foodImage(@PathVariable Long foodId) {
        return service.getFoodImage(foodId)
                .map(img -> ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType(img.mimeType()))
                        .cacheControl(CacheControl.maxAge(7, TimeUnit.DAYS).cachePublic())
                        .body(img.data()))
                .orElse(ResponseEntity.notFound().build());
    }
}
