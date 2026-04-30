package lydiacharif.nutridzbackend.Repositories;

import lydiacharif.nutridzbackend.Enums.*;
import lydiacharif.nutridzbackend.Models.Food;
import lydiacharif.nutridzbackend.Models.FoodServingSize;
import org.jooq.DSLContext;
import org.jooq.Record;
import org.jooq.Result;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.jooq.impl.DSL.field;
import static org.jooq.impl.DSL.table;

@Repository
@Transactional
public class FoodRepository {

    private final DSLContext dslContext;
    private static final String TABLE = "foods";
    private static final String SERVING_TABLE = "food_serving_sizes";

    public FoodRepository(@Qualifier("dslContext") DSLContext dslContext) {
        this.dslContext = dslContext;
    }

    public Food save(Food food) {
        if (food.getId() == null) {
            dslContext.insertInto(table(TABLE))
                    .set(field("name"),                food.getName())
                    .set(field("name_ar"),             food.getNameAr())
                    .set(field("category"),            food.getCategory().name())
                    .set(field("source"),              food.getSource().name())
                    .set(field("calories_per_100g"),   food.getCaloriesPer100g())
                    .set(field("protein_per_100g"),    food.getProteinPer100g())
                    .set(field("carbs_per_100g"),      food.getCarbsPer100g())
                    .set(field("fat_per_100g"),        food.getFatPer100g())
                    .set(field("fiber_per_100g"),      food.getFiberPer100g())
                    .set(field("sugar_per_100g"),      food.getSugarPer100g())
                    .set(field("salt_per_100g"),       food.getSaltPer100g())
                    .set(field("nutritional_score"),   food.getNutritionalScore() != null ? food.getNutritionalScore().name() : null)
                    .set(field("barcode"),             food.getBarcode())
                    .set(field("image_url"),           food.getImageUrl())
                    .set(field("verified"),            food.getVerified() != null && food.getVerified() ? 1 : 0)
                    .execute();
            food.setId(dslContext.lastID().longValue());
        } else {
            dslContext.update(table(TABLE))
                    .set(field("name"),                food.getName())
                    .set(field("name_ar"),             food.getNameAr())
                    .set(field("category"),            food.getCategory().name())
                    .set(field("source"),              food.getSource().name())
                    .set(field("calories_per_100g"),   food.getCaloriesPer100g())
                    .set(field("protein_per_100g"),    food.getProteinPer100g())
                    .set(field("carbs_per_100g"),      food.getCarbsPer100g())
                    .set(field("fat_per_100g"),        food.getFatPer100g())
                    .set(field("fiber_per_100g"),      food.getFiberPer100g())
                    .set(field("sugar_per_100g"),      food.getSugarPer100g())
                    .set(field("salt_per_100g"),       food.getSaltPer100g())
                    .set(field("nutritional_score"),   food.getNutritionalScore() != null ? food.getNutritionalScore().name() : null)
                    .set(field("barcode"),             food.getBarcode())
                    .set(field("image_url"),           food.getImageUrl())
                    .set(field("verified"),            food.getVerified() != null && food.getVerified() ? 1 : 0)
                    .where(field("id").eq(food.getId()))
                    .execute();
        }
        return food;
    }

    public Optional<Food> findById(Long id) {
        Record record = dslContext.select()
                .from(table(TABLE))
                .where(field("id").eq(id))
                .fetchOne();
        return record != null ? Optional.of(mapToFood(record)) : Optional.empty();
    }

    public Optional<Food> findByBarcode(String barcode) {
        Record record = dslContext.select()
                .from(table(TABLE))
                .where(field("barcode").eq(barcode))
                .fetchOne();
        return record != null ? Optional.of(mapToFood(record)) : Optional.empty();
    }

    public List<Food> search(String query) {
        Result<Record> result = dslContext.select()
                .from(table(TABLE))
                .where(field("name").likeIgnoreCase("%" + query + "%")
                        .or(field("name_ar").likeIgnoreCase("%" + query + "%")))
                .orderBy(field("verified").desc(), field("name").asc())
                .limit(30)
                .fetch();

        List<Food> foods = new ArrayList<>();
        for (Record r : result) foods.add(mapToFood(r));
        return foods;
    }

    public List<Food> findByCategory(FoodCategory category) {
        Result<Record> result = dslContext.select()
                .from(table(TABLE))
                .where(field("category").eq(category.name()))
                .orderBy(field("name").asc())
                .fetch();

        List<Food> foods = new ArrayList<>();
        for (Record r : result) foods.add(mapToFood(r));
        return foods;
    }

    public List<Food> findAll() {
        Result<Record> result = dslContext.select()
                .from(table(TABLE))
                .orderBy(field("verified").desc(), field("name").asc())
                .fetch();

        List<Food> foods = new ArrayList<>();
        for (Record r : result) foods.add(mapToFood(r));
        return foods;
    }

    public void deleteById(Long id) {
        dslContext.deleteFrom(table(TABLE))
                .where(field("id").eq(id))
                .execute();
    }

    public boolean existsByBarcode(String barcode) {
        return findByBarcode(barcode).isPresent();
    }

    public FoodServingSize saveServingSize(FoodServingSize serving) {
        if (serving.getId() == null) {
            dslContext.insertInto(table(SERVING_TABLE))
                    .set(field("food_id"), serving.getFoodId())
                    .set(field("label"),   serving.getLabel())
                    .set(field("grams"),   serving.getGrams())
                    .execute();
            serving.setId(dslContext.lastID().longValue());
        } else {
            dslContext.update(table(SERVING_TABLE))
                    .set(field("label"), serving.getLabel())
                    .set(field("grams"), serving.getGrams())
                    .where(field("id").eq(serving.getId()))
                    .execute();
        }
        return serving;
    }

    public List<FoodServingSize> findServingSizesByFoodId(Long foodId) {
        Result<Record> result = dslContext.select()
                .from(table(SERVING_TABLE))
                .where(field("food_id").eq(foodId))
                .fetch();

        List<FoodServingSize> sizes = new ArrayList<>();
        for (Record r : result) {
            sizes.add(FoodServingSize.builder()
                    .id(r.get(field("id", Long.class)))
                    .foodId(r.get(field("food_id", Long.class)))
                    .label(r.get(field("label", String.class)))
                    .grams(toFloat(r, "grams"))
                    .build());
        }
        return sizes;
    }

    public void deleteServingSize(Long servingId) {
        dslContext.deleteFrom(table(SERVING_TABLE))
                .where(field("id").eq(servingId))
                .execute();
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

    private static <E extends Enum<E>> E toEnum(Class<E> enumClass, Record record, String column) {
        String val = record.get(field(column, String.class));
        return val != null ? Enum.valueOf(enumClass, val) : null;
    }

    private Food mapToFood(Record r) {
        return Food.builder()
                .id(r.get(field("id", Long.class)))
                .name(r.get(field("name", String.class)))
                .nameAr(r.get(field("name_ar", String.class)))
                .category(toEnum(FoodCategory.class, r, "category"))
                .source(toEnum(FoodSource.class, r, "source"))
                .caloriesPer100g(toFloat(r, "calories_per_100g"))
                .proteinPer100g(toFloat(r, "protein_per_100g"))
                .carbsPer100g(toFloat(r, "carbs_per_100g"))
                .fatPer100g(toFloat(r, "fat_per_100g"))
                .fiberPer100g(toFloat(r, "fiber_per_100g"))
                .sugarPer100g(toFloat(r, "sugar_per_100g"))
                .saltPer100g(toFloat(r, "salt_per_100g"))
                .nutritionalScore(toEnum(NutritionalScore.class, r, "nutritional_score"))
                .barcode(r.get(field("barcode", String.class)))
                .imageUrl(r.get(field("image_url", String.class)))
                .verified(toBoolean(r, "verified"))
                .build();
    }
}