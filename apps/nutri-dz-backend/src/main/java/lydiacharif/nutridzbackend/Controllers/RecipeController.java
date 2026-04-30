package lydiacharif.nutridzbackend.Controllers;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import lydiacharif.nutridzbackend.Dtos.request.recipe.AddCommentRequest;
import lydiacharif.nutridzbackend.Dtos.request.recipe.CreateRecipeRequest;
import lydiacharif.nutridzbackend.Dtos.response.recipe.RecipeResponse;
import lydiacharif.nutridzbackend.Enums.RecipeCategory;
import lydiacharif.nutridzbackend.Security.CustomUserPrincipal;
import lydiacharif.nutridzbackend.Services.RecipeService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/recipes")
@RequiredArgsConstructor
@Slf4j
@SecurityRequirement(name = "bearer-jwt")
@Tag(name = "Recipes", description = "Community recipes — create, discover, like, comment, save")
public class RecipeController {

    private final RecipeService recipeService;

    @Operation(summary = "Create a new recipe")
    @PostMapping
    public ResponseEntity<RecipeResponse> create(
            @AuthenticationPrincipal CustomUserPrincipal principal,
            @Valid @RequestBody CreateRecipeRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(recipeService.create(principal.user().getId(), request));
    }

    @Operation(summary = "Report a recipe (auto-hides at 3 reports)")
    @PostMapping("/{id}/report")
    public ResponseEntity<java.util.Map<String, Object>> report(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserPrincipal principal,
            @RequestBody(required = false) java.util.Map<String, String> body) {
        String reason = body != null ? body.getOrDefault("reason", "") : "";
        int newCount = recipeService.reportRecipe(id, principal.user().getId(), reason);
        return ResponseEntity.ok(java.util.Map.of(
                "reported", true,
                "reportedCount", newCount,
                "autoHidden", newCount >= 3
        ));
    }

    @Operation(summary = "Get recipe by ID")
    @GetMapping("/{id}")
    public ResponseEntity<RecipeResponse> getById(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserPrincipal principal) {
        return ResponseEntity.ok(recipeService.getById(id, principal.user().getId()));
    }

    @Operation(summary = "Update a recipe")
    @PutMapping("/{id}")
    public ResponseEntity<RecipeResponse> update(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserPrincipal principal,
            @Valid @RequestBody CreateRecipeRequest request) {
        return ResponseEntity.ok(recipeService.update(principal.user().getId(), id, request));
    }

    @Operation(summary = "Delete a recipe")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserPrincipal principal) {
        recipeService.delete(principal.user().getId(), id);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Community feed — most liked public recipes")
    @GetMapping("/feed")
    public ResponseEntity<List<RecipeResponse>> feed(
            @AuthenticationPrincipal CustomUserPrincipal principal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(recipeService.getCommunityFeed(page, size, principal.user().getId()));
    }

    @Operation(summary = "Filter by category")
    @GetMapping("/category/{category}")
    public ResponseEntity<List<RecipeResponse>> byCategory(
            @PathVariable RecipeCategory category,
            @AuthenticationPrincipal CustomUserPrincipal principal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(recipeService.getByCategory(category, page, size, principal.user().getId()));
    }

    @Operation(summary = "Search recipes by title")
    @GetMapping("/search")
    public ResponseEntity<List<RecipeResponse>> search(
            @RequestParam String q,
            @AuthenticationPrincipal CustomUserPrincipal principal) {
        return ResponseEntity.ok(recipeService.search(q, principal.user().getId()));
    }

    @Operation(summary = "My published recipes")
    @GetMapping("/my")
    public ResponseEntity<List<RecipeResponse>> myRecipes(
            @AuthenticationPrincipal CustomUserPrincipal principal) {
        return ResponseEntity.ok(recipeService.getMyRecipes(principal.user().getId()));
    }

    @Operation(summary = "My saved recipes")
    @GetMapping("/saved")
    public ResponseEntity<List<RecipeResponse>> savedRecipes(
            @AuthenticationPrincipal CustomUserPrincipal principal) {
        return ResponseEntity.ok(recipeService.getSavedRecipes(principal.user().getId()));
    }

    @Operation(summary = "My liked recipes")
    @GetMapping("/liked")
    public ResponseEntity<List<RecipeResponse>> likedRecipes(
            @AuthenticationPrincipal CustomUserPrincipal principal) {
        return ResponseEntity.ok(recipeService.getLikedRecipes(principal.user().getId()));
    }
    
    @Operation(summary = "Like / unlike a recipe")
    @PostMapping("/{id}/like")
    public ResponseEntity<Void> toggleLike(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserPrincipal principal) {
        recipeService.toggleLike(principal.user().getId(), id);
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "Save / unsave a recipe")
    @PostMapping("/{id}/save")
    public ResponseEntity<Void> toggleSave(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserPrincipal principal) {
        recipeService.toggleSave(principal.user().getId(), id);
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "Add a comment")
    @PostMapping("/{id}/comments")
    public ResponseEntity<RecipeResponse.CommentResponse> addComment(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserPrincipal principal,
            @Valid @RequestBody AddCommentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(recipeService.addComment(principal.user().getId(), id, request));
    }

    @Operation(summary = "Delete a comment")
    @DeleteMapping("/comments/{commentId}")
    public ResponseEntity<Void> deleteComment(
            @PathVariable Long commentId,
            @AuthenticationPrincipal CustomUserPrincipal principal) {
        recipeService.deleteComment(principal.user().getId(), commentId);
        return ResponseEntity.noContent().build();
    }
}