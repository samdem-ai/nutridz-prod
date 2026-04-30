package lydiacharif.nutridzbackend.Repositories;

import jakarta.validation.constraints.NotNull;
import lydiacharif.nutridzbackend.Enums.RecipeCategory;
import lydiacharif.nutridzbackend.Models.*;
import org.jooq.DSLContext;
import org.jooq.Record;
import org.jooq.Record1;
import org.jooq.Result;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.jooq.impl.DSL.field;
import static org.jooq.impl.DSL.table;

@Repository
@Transactional
public class RecipeRepository {

    private final DSLContext dsl;
    private static final String TABLE         = "recipes";
    private static final String ING_TABLE     = "recipe_ingredients";
    private static final String STEP_TABLE    = "recipe_steps";
    private static final String LIKE_TABLE    = "recipe_likes";
    private static final String COMMENT_TABLE = "recipe_comments";
    private static final String SAVED_TABLE   = "saved_recipes";

    public RecipeRepository(@Qualifier("dslContext") DSLContext dsl) {
        this.dsl = dsl;
    }

    public Recipe save(Recipe recipe) {
        if (recipe.getId() == null) {
            dsl.insertInto(table(TABLE))
                    .set(field("author_id"),            recipe.getAuthorId())
                    .set(field("title"),                recipe.getTitle())
                    .set(field("title_ar"),             recipe.getTitleAr())
                    .set(field("description"),          recipe.getDescription())
                    .set(field("image_url"),            recipe.getImageUrl())
                    .set(field("prep_time_minutes"),    recipe.getPrepTimeMinutes())
                    .set(field("servings"),             recipe.getServings() != null ? recipe.getServings() : 1)
                    .set(field("calories_per_serving"), recipe.getCaloriesPerServing())
                    .set(field("protein_per_serving"),  recipe.getProteinPerServing())
                    .set(field("carbs_per_serving"),    recipe.getCarbsPerServing())
                    .set(field("fat_per_serving"),      recipe.getFatPerServing())
                    .set(field("category"),             recipe.getCategory().name())
                    .set(field("is_algerian"),          recipe.getIsAlgerian() != null && recipe.getIsAlgerian() ? 1 : 0)
                    .set(field("is_public"),            recipe.getIsPublic() != null && recipe.getIsPublic() ? 1 : 0)
                    .set(field("likes_count"),          0)
                    .set(field("created_at"),           LocalDateTime.now())
                    .execute();
            recipe.setId(dsl.lastID().longValue());
        } else {
            dsl.update(table(TABLE))
                    .set(field("title"),                recipe.getTitle())
                    .set(field("title_ar"),             recipe.getTitleAr())
                    .set(field("description"),          recipe.getDescription())
                    .set(field("image_url"),            recipe.getImageUrl())
                    .set(field("prep_time_minutes"),    recipe.getPrepTimeMinutes())
                    .set(field("servings"),             recipe.getServings())
                    .set(field("calories_per_serving"), recipe.getCaloriesPerServing())
                    .set(field("protein_per_serving"),  recipe.getProteinPerServing())
                    .set(field("carbs_per_serving"),    recipe.getCarbsPerServing())
                    .set(field("fat_per_serving"),      recipe.getFatPerServing())
                    .set(field("category"),             recipe.getCategory().name())
                    .set(field("is_algerian"),          recipe.getIsAlgerian() != null && recipe.getIsAlgerian() ? 1 : 0)
                    .set(field("is_public"),            recipe.getIsPublic() != null && recipe.getIsPublic() ? 1 : 0)
                    .where(field("id").eq(recipe.getId()))
                    .execute();
        }
        return recipe;
    }

    public Optional<Recipe> findById(Long id) {
        Record r = dsl.select().from(table(TABLE))
                .where(field("id").eq(id)).fetchOne();
        return r != null ? Optional.of(mapRecipe(r)) : Optional.empty();
    }

    public List<Recipe> findPublic(int limit, int offset) {
        Result<Record> result = dsl.select().from(table(TABLE))
                .where(field("is_public").eq(1))
                .orderBy(field("likes_count").desc(), field("created_at").desc())
                .limit(limit).offset(offset)
                .fetch();
        List<Recipe> list = new ArrayList<>();
        for (Record r : result) list.add(mapRecipe(r));
        return list;
    }

    public List<Recipe> findByCategory(RecipeCategory category, int limit, int offset) {
        Result<Record> result = dsl.select().from(table(TABLE))
                .where(field("is_public").eq(1)
                        .and(field("category").eq(category.name())))
                .orderBy(field("likes_count").desc())
                .limit(limit).offset(offset)
                .fetch();
        List<Recipe> list = new ArrayList<>();
        for (Record r : result) list.add(mapRecipe(r));
        return list;
    }

    public List<Recipe> findByAuthor(Long authorId) {
        Result<Record> result = dsl.select().from(table(TABLE))
                .where(field("author_id").eq(authorId))
                .orderBy(field("created_at").desc())
                .fetch();
        List<Recipe> list = new ArrayList<>();
        for (Record r : result) list.add(mapRecipe(r));
        return list;
    }

    public List<Recipe> search(String query) {
        Result<Record> result = dsl.select().from(table(TABLE))
                .where(field("is_public").eq(1)
                        .and(field("title").likeIgnoreCase("%" + query + "%")
                                .or(field("title_ar").likeIgnoreCase("%" + query + "%"))))
                .orderBy(field("likes_count").desc())
                .limit(30)
                .fetch();
        List<Recipe> list = new ArrayList<>();
        for (Record r : result) list.add(mapRecipe(r));
        return list;
    }

    public void deleteById(Long id) {
        dsl.deleteFrom(table(TABLE)).where(field("id").eq(id)).execute();
    }

    public void incrementLikes(Long recipeId) {
        dsl.execute("UPDATE " + TABLE + " SET likes_count = likes_count + 1 WHERE id = ?", recipeId);
    }

    public void decrementLikes(Long recipeId) {
        dsl.execute("UPDATE " + TABLE + " SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = ?", recipeId);
    }

    public RecipeIngredient saveIngredient(RecipeIngredient ing) {
        if (ing.getId() == null) {
            dsl.insertInto(table(ING_TABLE))
                    .set(field("recipe_id"),      ing.getRecipeId())
                    .set(field("food_id"),         ing.getFoodId())
                    .set(field("quantity_grams"),  ing.getQuantityGrams())
                    .set(field("label"),           ing.getLabel())
                    .execute();
            ing.setId(dsl.lastID().longValue());
        } else {
            dsl.update(table(ING_TABLE))
                    .set(field("quantity_grams"), ing.getQuantityGrams())
                    .set(field("label"),          ing.getLabel())
                    .where(field("id").eq(ing.getId()))
                    .execute();
        }
        return ing;
    }

    public List<RecipeIngredient> findIngredientsByRecipeId(Long recipeId) {
        Result<Record> result = dsl.select().from(table(ING_TABLE))
                .where(field("recipe_id").eq(recipeId)).fetch();
        List<RecipeIngredient> list = new ArrayList<>();
        for (Record r : result) {
            list.add(RecipeIngredient.builder()
                    .id(r.get(field("id", Long.class)))
                    .recipeId(r.get(field("recipe_id", Long.class)))
                    .foodId(r.get(field("food_id", Long.class)))
                    .quantityGrams(toFloat(r, "quantity_grams"))
                    .label(r.get(field("label", String.class)))
                    .build());
        }
        return list;
    }

    public void deleteIngredientsByRecipeId(Long recipeId) {
        dsl.deleteFrom(table(ING_TABLE)).where(field("recipe_id").eq(recipeId)).execute();
    }

    public void saveStep(RecipeStep step) {
        if (step.getId() == null) {
            dsl.insertInto(table(STEP_TABLE))
                    .set(field("recipe_id"),   step.getRecipeId())
                    .set(field("step_number"), step.getStepNumber())
                    .set(field("description"), step.getDescription())
                    .execute();
            step.setId(dsl.lastID().longValue());
        } else {
            dsl.update(table(STEP_TABLE))
                    .set(field("description"), step.getDescription())
                    .where(field("id").eq(step.getId()))
                    .execute();
        }
    }

    public List<RecipeStep> findStepsByRecipeId(Long recipeId) {
        Result<Record> result = dsl.select().from(table(STEP_TABLE))
                .where(field("recipe_id").eq(recipeId))
                .orderBy(field("step_number").asc()).fetch();
        List<RecipeStep> list = new ArrayList<>();
        for (Record r : result) {
            list.add(RecipeStep.builder()
                    .id(r.get(field("id", Long.class)))
                    .recipeId(r.get(field("recipe_id", Long.class)))
                    .stepNumber(r.get(field("step_number", Integer.class)))
                    .description(r.get(field("description", String.class)))
                    .build());
        }
        return list;
    }

    public void deleteStepsByRecipeId(Long recipeId) {
        dsl.deleteFrom(table(STEP_TABLE)).where(field("recipe_id").eq(recipeId)).execute();
    }

    public boolean hasLiked(Long userId, Long recipeId) {
        return dsl.fetchCount(
                dsl.select().from(table(LIKE_TABLE))
                        .where(field("user_id").eq(userId)
                                .and(field("recipe_id").eq(recipeId)))) > 0;
    }

    public void saveLike(Long userId, Long recipeId) {
        dsl.insertInto(table(LIKE_TABLE))
                .set(field("user_id"),   userId)
                .set(field("recipe_id"), recipeId)
                .set(field("liked_at"),  LocalDateTime.now())
                .execute();
    }

    public void deleteLike(Long userId, Long recipeId) {
        dsl.deleteFrom(table(LIKE_TABLE))
                .where(field("user_id").eq(userId)
                        .and(field("recipe_id").eq(recipeId)))
                .execute();
    }

    public RecipeComment saveComment(RecipeComment comment) {
        dsl.insertInto(table(COMMENT_TABLE))
                .set(field("user_id"),    comment.getUserId())
                .set(field("recipe_id"),  comment.getRecipeId())
                .set(field("content"),    comment.getContent())
                .set(field("created_at"), LocalDateTime.now())
                .execute();
        comment.setId(dsl.lastID().longValue());
        return comment;
    }

    public List<RecipeComment> findCommentsByRecipeId(Long recipeId) {
        Result<Record> result = dsl.select().from(table(COMMENT_TABLE))
                .where(field("recipe_id").eq(recipeId))
                .orderBy(field("created_at").asc()).fetch();
        List<RecipeComment> list = new ArrayList<>();
        for (Record r : result) {
            list.add(RecipeComment.builder()
                    .id(r.get(field("id", Long.class)))
                    .userId(r.get(field("user_id", Long.class)))
                    .recipeId(r.get(field("recipe_id", Long.class)))
                    .content(r.get(field("content", String.class)))
                    .createdAt(toLocalDateTime(r.get(field("created_at"))))
                    .build());
        }
        return list;
    }

    public void deleteComment(Long commentId) {
        dsl.deleteFrom(table(COMMENT_TABLE)).where(field("id").eq(commentId)).execute();
    }

    public boolean hasSaved(Long userId, Long recipeId) {
        return dsl.fetchCount(
                dsl.select().from(table(SAVED_TABLE))
                        .where(field("user_id").eq(userId)
                                .and(field("recipe_id").eq(recipeId)))) > 0;
    }

    public void saveRecipe(Long userId, Long recipeId) {
        dsl.insertInto(table(SAVED_TABLE))
                .set(field("user_id"),   userId)
                .set(field("recipe_id"), recipeId)
                .set(field("saved_at"),  LocalDateTime.now())
                .execute();
    }

    public void unsaveRecipe(Long userId, Long recipeId) {
        dsl.deleteFrom(table(SAVED_TABLE))
                .where(field("user_id").eq(userId)
                        .and(field("recipe_id").eq(recipeId)))
                .execute();
    }

    public List<Recipe> findSavedByUser(Long userId) {
        // 2-step: fetch recipe IDs from join table (ordered by saved_at DESC), then load each recipe
        var ids = dsl.select(field("recipe_id", Long.class))
                .from(table(SAVED_TABLE))
                .where(field("user_id").eq(userId))
                .orderBy(field("saved_at").desc())
                .fetch(field("recipe_id", Long.class));
        List<Recipe> list = new ArrayList<>();
        for (Long id : ids) {
            findById(id).ifPresent(list::add);
        }
        return list;
    }

    public List<Recipe> findLikedByUser(Long userId) {
        var ids = dsl.select(field("recipe_id", Long.class))
                .from(table(LIKE_TABLE))
                .where(field("user_id").eq(userId))
                .orderBy(field("liked_at").desc())
                .fetch(field("recipe_id", Long.class));
        List<Recipe> list = new ArrayList<>();
        for (Long id : ids) {
            findById(id).ifPresent(list::add);
        }
        return list;
    }

    private static Float toFloat(Record r, String column) {
        Double val = r.get(field(column, Double.class));
        return val != null ? val.floatValue() : null;
    }

    private static boolean toBoolean(Record r, String column) {
        Object raw = r.get(field(column));
        if (raw == null) return false;
        if (raw instanceof Boolean b) return b;
        if (raw instanceof Number n) return n.intValue() == 1;
        return false;
    }

    private static LocalDateTime toLocalDateTime(Object raw) {
        if (raw == null) return null;
        if (raw instanceof LocalDateTime ldt) return ldt;
        if (raw instanceof Timestamp ts) return ts.toLocalDateTime();
        return null;
    }

    private Recipe mapRecipe(Record r) {
        return Recipe.builder()
                .id(r.get(field("id", Long.class)))
                .authorId(r.get(field("author_id", Long.class)))
                .title(r.get(field("title", String.class)))
                .titleAr(r.get(field("title_ar", String.class)))
                .description(r.get(field("description", String.class)))
                .imageUrl(r.get(field("image_url", String.class)))
                .prepTimeMinutes(r.get(field("prep_time_minutes", Integer.class)))
                .servings(r.get(field("servings", Integer.class)))
                .caloriesPerServing(toFloat(r, "calories_per_serving"))
                .proteinPerServing(toFloat(r, "protein_per_serving"))
                .carbsPerServing(toFloat(r, "carbs_per_serving"))
                .fatPerServing(toFloat(r, "fat_per_serving"))
                .category(RecipeCategory.valueOf(r.get(field("category", String.class))))
                .isAlgerian(toBoolean(r, "is_algerian"))
                .isPublic(toBoolean(r, "is_public"))
                .likesCount(r.get(field("likes_count", Integer.class)))
                .createdAt(toLocalDateTime(r.get(field("created_at"))))
                .build();
    }
}