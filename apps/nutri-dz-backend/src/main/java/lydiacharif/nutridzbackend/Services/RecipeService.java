package lydiacharif.nutridzbackend.Services;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import lydiacharif.nutridzbackend.Dtos.request.recipe.AddCommentRequest;
import lydiacharif.nutridzbackend.Dtos.request.recipe.CreateRecipeRequest;
import lydiacharif.nutridzbackend.Dtos.response.recipe.RecipeResponse;
import lydiacharif.nutridzbackend.Enums.RecipeCategory;
import lydiacharif.nutridzbackend.Exceptions.ResourceNotFoundException;
import lydiacharif.nutridzbackend.Exceptions.UnauthorizedActionException;
import lydiacharif.nutridzbackend.Models.*;
import lydiacharif.nutridzbackend.Repositories.FoodRepository;
import lydiacharif.nutridzbackend.Repositories.RecipeRepository;
import lydiacharif.nutridzbackend.Repositories.UserRepository;
import org.jooq.DSLContext;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import static org.jooq.impl.DSL.field;
import static org.jooq.impl.DSL.table;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class RecipeService {

    private final RecipeRepository recipeRepository;
    private final FoodRepository foodRepository;
    private final UserRepository userRepository;
    @Qualifier("dslContext")
    private final DSLContext dsl;

    @Transactional
    public int reportRecipe(Long recipeId, Long userId, String reason) {
        Recipe recipe = recipeRepository.findById(recipeId)
                .orElseThrow(() -> new ResourceNotFoundException("Recipe", recipeId));

        // Insert report (unique constraint prevents double-report)
        try {
            dsl.insertInto(table("recipe_reports"))
                    .set(field("recipe_id"), recipeId)
                    .set(field("user_id"), userId)
                    .set(field("reason"), reason != null ? reason : "")
                    .execute();
        } catch (Exception e) {
            log.warn("User {} already reported recipe {}", userId, recipeId);
            Integer cnt = dsl.select(field("reported_count", Integer.class))
                    .from(table("recipes"))
                    .where(field("id").eq(recipeId))
                    .fetchOneInto(Integer.class);
            return cnt != null ? cnt : 0;
        }

        // Increment counter on recipe
        Integer current = dsl.select(field("reported_count", Integer.class))
                .from(table("recipes"))
                .where(field("id").eq(recipeId))
                .fetchOneInto(Integer.class);
        int curr = current != null ? current : 0;
        dsl.update(table("recipes"))
                .set(field("reported_count", Integer.class), curr + 1)
                .where(field("id").eq(recipeId))
                .execute();

        Integer newCount = dsl.select(field("reported_count", Integer.class))
                .from(table("recipes"))
                .where(field("id").eq(recipeId))
                .fetchOneInto(Integer.class);
        int count = newCount != null ? newCount : 0;

        // Auto-hide at 3 reports
        if (count >= 3 && Boolean.TRUE.equals(recipe.getIsPublic())) {
            dsl.update(table("recipes"))
                    .set(field("is_public"), 0)
                    .where(field("id").eq(recipeId))
                    .execute();
            log.info("Recipe {} auto-hidden (reports={})", recipeId, count);
        }
        return count;
    }

    @Transactional
    public RecipeResponse create(Long userId, CreateRecipeRequest request) {
        Recipe recipe = Recipe.builder()
                .authorId(userId)
                .title(request.getTitle())
                .titleAr(request.getTitleAr())
                .description(request.getDescription())
                .imageUrl(request.getImageUrl())
                .prepTimeMinutes(request.getPrepTimeMinutes())
                .servings(request.getServings())
                .category(request.getCategory())
                .isAlgerian(request.getIsAlgerian())
                .isPublic(request.getIsPublic() != null ? request.getIsPublic() : true)
                .build();

        Recipe saved = recipeRepository.save(recipe);
        List<RecipeIngredient> ingredients = saveIngredients(saved.getId(), request.getIngredients());
        calculateAndSetMacros(saved, ingredients);
        recipeRepository.save(saved);
        saveSteps(saved.getId(), request.getSteps());

        log.info("Recipe created id={} by user={}", saved.getId(), userId);
        return buildResponse(saved, userId, true, true);
    }

    public RecipeResponse getById(Long recipeId, Long requestingUserId) {
        Recipe recipe = recipeRepository.findById(recipeId)
                .orElseThrow(() -> new ResourceNotFoundException("Recipe", recipeId));
        return buildResponse(recipe, requestingUserId, true, true);
    }

    public List<RecipeResponse> getCommunityFeed(int page, int size, Long userId) {
        return recipeRepository.findPublic(size, page * size)
                .stream()
                .map(r -> buildResponse(r, userId, false, false))
                .collect(Collectors.toList());
    }

    public List<RecipeResponse> getByCategory(RecipeCategory category, int page, int size, Long userId) {
        return recipeRepository.findByCategory(category, size, page * size)
                .stream()
                .map(r -> buildResponse(r, userId, false, false))
                .collect(Collectors.toList());
    }

    public List<RecipeResponse> getMyRecipes(Long userId) {
        return recipeRepository.findByAuthor(userId)
                .stream()
                .map(r -> buildResponse(r, userId, false, false))
                .collect(Collectors.toList());
    }

    public List<RecipeResponse> getSavedRecipes(Long userId) {
        return recipeRepository.findSavedByUser(userId)
                .stream()
                .map(r -> buildResponse(r, userId, false, false))
                .collect(Collectors.toList());
    }

    public List<RecipeResponse> getLikedRecipes(Long userId) {
        return recipeRepository.findLikedByUser(userId)
                .stream()
                .map(r -> buildResponse(r, userId, false, false))
                .collect(Collectors.toList());
    }

    public List<RecipeResponse> search(String query, Long userId) {
        return recipeRepository.search(query)
                .stream()
                .map(r -> buildResponse(r, userId, false, false))
                .collect(Collectors.toList());
    }

    @Transactional
    public RecipeResponse update(Long userId, Long recipeId, CreateRecipeRequest request) {
        Recipe recipe = recipeRepository.findById(recipeId)
                .orElseThrow(() -> new ResourceNotFoundException("Recipe", recipeId));

        if (!recipe.getAuthorId().equals(userId))
            throw new UnauthorizedActionException("edit this recipe");

        recipe.setTitle(request.getTitle());
        recipe.setTitleAr(request.getTitleAr());
        recipe.setDescription(request.getDescription());
        recipe.setImageUrl(request.getImageUrl());
        recipe.setPrepTimeMinutes(request.getPrepTimeMinutes());
        recipe.setServings(request.getServings());
        recipe.setCategory(request.getCategory());
        recipe.setIsAlgerian(request.getIsAlgerian());
        recipe.setIsPublic(request.getIsPublic());

        recipeRepository.deleteIngredientsByRecipeId(recipeId);
        recipeRepository.deleteStepsByRecipeId(recipeId);

        List<RecipeIngredient> ingredients = saveIngredients(recipeId, request.getIngredients());
        calculateAndSetMacros(recipe, ingredients);
        saveSteps(recipeId, request.getSteps());
        recipeRepository.save(recipe);

        return buildResponse(recipe, userId, true, true);
    }

    @Transactional
    public void delete(Long userId, Long recipeId) {
        Recipe recipe = recipeRepository.findById(recipeId)
                .orElseThrow(() -> new ResourceNotFoundException("Recipe", recipeId));

        if (!recipe.getAuthorId().equals(userId))
            throw new UnauthorizedActionException("delete this recipe");

        recipeRepository.deleteById(recipeId);
        log.info("Recipe deleted id={} by user={}", recipeId, userId);
    }

    @Transactional
    public void toggleLike(Long userId, Long recipeId) {
        recipeRepository.findById(recipeId)
                .orElseThrow(() -> new ResourceNotFoundException("Recipe", recipeId));

        if (recipeRepository.hasLiked(userId, recipeId)) {
            recipeRepository.deleteLike(userId, recipeId);
            recipeRepository.decrementLikes(recipeId);
            log.info("User {} unliked recipe {}", userId, recipeId);
        } else {
            recipeRepository.saveLike(userId, recipeId);
            recipeRepository.incrementLikes(recipeId);
            log.info("User {} liked recipe {}", userId, recipeId);
        }
    }

    @Transactional
    public void toggleSave(Long userId, Long recipeId) {
        recipeRepository.findById(recipeId)
                .orElseThrow(() -> new ResourceNotFoundException("Recipe", recipeId));

        if (recipeRepository.hasSaved(userId, recipeId)) {
            recipeRepository.unsaveRecipe(userId, recipeId);
        } else {
            recipeRepository.saveRecipe(userId, recipeId);
        }
    }

    @Transactional
    public RecipeResponse.CommentResponse addComment(Long userId, Long recipeId, AddCommentRequest request) {
        recipeRepository.findById(recipeId)
                .orElseThrow(() -> new ResourceNotFoundException("Recipe", recipeId));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        RecipeComment comment = RecipeComment.builder()
                .userId(userId)
                .recipeId(recipeId)
                .content(request.getContent())
                .build();

        RecipeComment saved = recipeRepository.saveComment(comment);

        return RecipeResponse.CommentResponse.builder()
                .id(saved.getId())
                .userId(userId)
                .username(user.getUsername())
                .content(saved.getContent())
                .createdAt(saved.getCreatedAt())
                .build();
    }

    @Transactional
    public void deleteComment(Long userId, Long commentId) {
        recipeRepository.deleteComment(commentId);
    }

    private List<RecipeIngredient> saveIngredients(Long recipeId,
                                                   List<CreateRecipeRequest.IngredientRequest> requests) {
        List<RecipeIngredient> saved = new ArrayList<>();
        for (CreateRecipeRequest.IngredientRequest req : requests) {
            RecipeIngredient ing = RecipeIngredient.builder()
                    .recipeId(recipeId)
                    .foodId(req.getFoodId())
                    .quantityGrams(req.getQuantityGrams())
                    .label(req.getLabel())
                    .build();
            saved.add(recipeRepository.saveIngredient(ing));
        }
        return saved;
    }

    private void saveSteps(Long recipeId, List<CreateRecipeRequest.StepRequest> requests) {
        for (CreateRecipeRequest.StepRequest req : requests) {
            recipeRepository.saveStep(RecipeStep.builder()
                    .recipeId(recipeId)
                    .stepNumber(req.getStepNumber())
                    .description(req.getDescription())
                    .build());
        }
    }

    private void calculateAndSetMacros(Recipe recipe, List<RecipeIngredient> ingredients) {
        float totalCal = 0, totalProt = 0, totalCarbs = 0, totalFat = 0;
        for (RecipeIngredient ing : ingredients) {
            Food food = foodRepository.findById(ing.getFoodId()).orElse(null);
            if (food == null) continue;
            float ratio = ing.getQuantityGrams() / 100f;
            totalCal   += orZero(food.getCaloriesPer100g()) * ratio;
            totalProt  += orZero(food.getProteinPer100g())  * ratio;
            totalCarbs += orZero(food.getCarbsPer100g())    * ratio;
            totalFat   += orZero(food.getFatPer100g())      * ratio;
        }
        int servings = recipe.getServings() != null && recipe.getServings() > 0 ? recipe.getServings() : 1;
        recipe.setCaloriesPerServing(totalCal   / servings);
        recipe.setProteinPerServing(totalProt   / servings);
        recipe.setCarbsPerServing(totalCarbs    / servings);
        recipe.setFatPerServing(totalFat        / servings);
    }

    private RecipeResponse buildResponse(Recipe recipe, Long requestingUserId,
                                         boolean includeIngredients, boolean includeComments) {
        String authorUsername = userRepository.findById(recipe.getAuthorId())
                .map(User::getUsername).orElse("unknown");

        List<RecipeResponse.IngredientResponse> ingredients = new ArrayList<>();
        if (includeIngredients) {
            for (RecipeIngredient ing : recipeRepository.findIngredientsByRecipeId(recipe.getId())) {
                Food food = foodRepository.findById(ing.getFoodId()).orElse(null);
                float ratio = ing.getQuantityGrams() / 100f;
                ingredients.add(RecipeResponse.IngredientResponse.builder()
                        .id(ing.getId())
                        .foodId(ing.getFoodId())
                        .foodName(food != null ? food.getName() : null)
                        .quantityGrams(ing.getQuantityGrams())
                        .label(ing.getLabel())
                        .calories(food != null ? orZero(food.getCaloriesPer100g()) * ratio : null)
                        .protein(food  != null ? orZero(food.getProteinPer100g())  * ratio : null)
                        .carbs(food    != null ? orZero(food.getCarbsPer100g())    * ratio : null)
                        .fat(food      != null ? orZero(food.getFatPer100g())      * ratio : null)
                        .build());
            }
        }

        List<RecipeResponse.StepResponse> steps = recipeRepository
                .findStepsByRecipeId(recipe.getId()).stream()
                .map(s -> RecipeResponse.StepResponse.builder()
                        .id(s.getId())
                        .stepNumber(s.getStepNumber())
                        .description(s.getDescription())
                        .build())
                .collect(Collectors.toList());

        List<RecipeResponse.CommentResponse> comments = new ArrayList<>();
        if (includeComments) {
            for (RecipeComment c : recipeRepository.findCommentsByRecipeId(recipe.getId())) {
                String commenterUsername = userRepository.findById(c.getUserId())
                        .map(User::getUsername).orElse("unknown");
                comments.add(RecipeResponse.CommentResponse.builder()
                        .id(c.getId())
                        .userId(c.getUserId())
                        .username(commenterUsername)
                        .content(c.getContent())
                        .createdAt(c.getCreatedAt())
                        .build());
            }
        }

        return RecipeResponse.builder()
                .id(recipe.getId())
                .authorId(recipe.getAuthorId())
                .authorUsername(authorUsername)
                .title(recipe.getTitle())
                .titleAr(recipe.getTitleAr())
                .description(recipe.getDescription())
                .imageUrl(recipe.getImageUrl())
                .prepTimeMinutes(recipe.getPrepTimeMinutes())
                .servings(recipe.getServings())
                .caloriesPerServing(recipe.getCaloriesPerServing())
                .proteinPerServing(recipe.getProteinPerServing())
                .carbsPerServing(recipe.getCarbsPerServing())
                .fatPerServing(recipe.getFatPerServing())
                .category(recipe.getCategory())
                .isAlgerian(recipe.getIsAlgerian())
                .isPublic(recipe.getIsPublic())
                .likesCount(recipe.getLikesCount())
                .likedByMe(requestingUserId != null && recipeRepository.hasLiked(requestingUserId, recipe.getId()))
                .savedByMe(requestingUserId != null && recipeRepository.hasSaved(requestingUserId, recipe.getId()))
                .createdAt(recipe.getCreatedAt())
                .ingredients(ingredients)
                .steps(steps)
                .comments(comments)
                .build();
    }

    private float orZero(Float val) {
        return val != null ? val : 0f;
    }
}