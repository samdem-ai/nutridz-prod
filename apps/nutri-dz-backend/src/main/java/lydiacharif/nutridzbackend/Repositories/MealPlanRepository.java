package lydiacharif.nutridzbackend.Repositories;

import lydiacharif.nutridzbackend.Enums.MealType;
import lydiacharif.nutridzbackend.Models.MealPlan;
import lydiacharif.nutridzbackend.Models.MealPlanItem;
import lydiacharif.nutridzbackend.Models.ShoppingListItem;
import org.jooq.DSLContext;
import org.jooq.Record;
import org.jooq.Result;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Date;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.jooq.impl.DSL.field;
import static org.jooq.impl.DSL.table;

@Repository
@Transactional
public class MealPlanRepository {

    private final DSLContext dsl;
    private static final String PLAN_TABLE     = "meal_plans";
    private static final String ITEM_TABLE     = "meal_plan_items";
    private static final String SHOPPING_TABLE = "shopping_list_items";

    public MealPlanRepository(@Qualifier("dslContext") DSLContext dsl) {
        this.dsl = dsl;
    }

    public MealPlan save(MealPlan plan) {
        if (plan.getId() == null) {
            dsl.insertInto(table(PLAN_TABLE))
                    .set(field("user_id"),       plan.getUserId())
                    .set(field("start_date"),    plan.getStartDate())
                    .set(field("end_date"),      plan.getEndDate())
                    .set(field("duration_days"), plan.getDurationDays())
                    .set(field("generated_at"),  LocalDateTime.now())
                    .execute();
            plan.setId(dsl.lastID().longValue());
        }
        return plan;
    }

    public Optional<MealPlan> findById(Long id) {
        Record r = dsl.select().from(table(PLAN_TABLE))
                .where(field("id").eq(id)).fetchOne();
        return r != null ? Optional.of(mapPlan(r)) : Optional.empty();
    }

    public List<MealPlan> findByUserId(Long userId) {
        Result<Record> result = dsl.select().from(table(PLAN_TABLE))
                .where(field("user_id").eq(userId))
                .orderBy(field("generated_at").desc())
                .fetch();
        List<MealPlan> list = new ArrayList<>();
        for (Record r : result) list.add(mapPlan(r));
        return list;
    }

    public void deleteById(Long id) {
        dsl.deleteFrom(table(PLAN_TABLE)).where(field("id").eq(id)).execute();
    }

    public MealPlanItem saveItem(MealPlanItem item) {
        if (item.getId() == null) {
            dsl.insertInto(table(ITEM_TABLE))
                    .set(field("meal_plan_id"),   item.getMealPlanId())
                    .set(field("date"),           item.getDate())
                    .set(field("meal_type"),      item.getMealType().name())
                    .set(field("recipe_id"),      item.getRecipeId())
                    .set(field("food_id"),        item.getFoodId())
                    .set(field("quantity_grams"), item.getQuantityGrams())
                    .set(field("calories"),       item.getCalories())
                    .execute();
            item.setId(dsl.lastID().longValue());
        }
        return item;
    }

    public List<MealPlanItem> findItemsByPlanId(Long planId) {
        Result<Record> result = dsl.select().from(table(ITEM_TABLE))
                .where(field("meal_plan_id").eq(planId))
                .orderBy(field("date").asc(), field("meal_type").asc())
                .fetch();
        List<MealPlanItem> list = new ArrayList<>();
        for (Record r : result) list.add(mapItem(r));
        return list;
    }

    public void deleteItemsByPlanId(Long planId) {
        dsl.deleteFrom(table(ITEM_TABLE))
                .where(field("meal_plan_id").eq(planId)).execute();
    }

    public ShoppingListItem saveShoppingItem(ShoppingListItem item) {
        if (item.getId() == null) {
            dsl.insertInto(table(SHOPPING_TABLE))
                    .set(field("meal_plan_id"),   item.getMealPlanId())
                    .set(field("food_id"),        item.getFoodId())
                    .set(field("quantity_grams"), item.getQuantityGrams())
                    .set(field("checked"),        false)
                    .execute();
            item.setId(dsl.lastID().longValue());
        } else {
            dsl.update(table(SHOPPING_TABLE))
                    .set(field("checked"), item.getChecked())
                    .where(field("id").eq(item.getId()))
                    .execute();
        }
        return item;
    }

    public List<ShoppingListItem> findShoppingItemsByPlanId(Long planId) {
        Result<Record> result = dsl.select().from(table(SHOPPING_TABLE))
                .where(field("meal_plan_id").eq(planId))
                .orderBy(field("food_id").asc())
                .fetch();
        List<ShoppingListItem> list = new ArrayList<>();
        for (Record r : result) list.add(mapShoppingItem(r));
        return list;
    }

    public Optional<ShoppingListItem> findShoppingItemById(Long id) {
        Record r = dsl.select().from(table(SHOPPING_TABLE))
                .where(field("id").eq(id)).fetchOne();
        return r != null ? Optional.of(mapShoppingItem(r)) : Optional.empty();
    }

    public void deleteShoppingItemsByPlanId(Long planId) {
        dsl.deleteFrom(table(SHOPPING_TABLE))
                .where(field("meal_plan_id").eq(planId)).execute();
    }

    private static Float toFloat(Record r, String column) {
        Double val = r.get(field(column, Double.class));
        return val != null ? val.floatValue() : null;
    }

    private static LocalDate toLocalDate(Object raw) {
        if (raw == null) return null;
        if (raw instanceof LocalDate ld) return ld;
        if (raw instanceof Date d) return d.toLocalDate();
        return null;
    }

    private static LocalDateTime toLocalDateTime(Object raw) {
        if (raw == null) return null;
        if (raw instanceof LocalDateTime ldt) return ldt;
        if (raw instanceof Timestamp ts) return ts.toLocalDateTime();
        return null;
    }

    private MealPlan mapPlan(Record r) {
        return MealPlan.builder()
                .id(r.get(field("id", Long.class)))
                .userId(r.get(field("user_id", Long.class)))
                .startDate(toLocalDate(r.get(field("start_date"))))
                .endDate(toLocalDate(r.get(field("end_date"))))
                .durationDays(r.get(field("duration_days", Integer.class)))
                .generatedAt(toLocalDateTime(r.get(field("generated_at"))))
                .build();
    }

    private MealPlanItem mapItem(Record r) {
        return MealPlanItem.builder()
                .id(r.get(field("id", Long.class)))
                .mealPlanId(r.get(field("meal_plan_id", Long.class)))
                .date(toLocalDate(r.get(field("date"))))
                .mealType(MealType.valueOf(r.get(field("meal_type", String.class))))
                .recipeId(r.get(field("recipe_id", Long.class)))
                .foodId(r.get(field("food_id", Long.class)))
                .quantityGrams(toFloat(r, "quantity_grams"))
                .calories(toFloat(r, "calories"))
                .build();
    }

    private ShoppingListItem mapShoppingItem(Record r) {
        return ShoppingListItem.builder()
                .id(r.get(field("id", Long.class)))
                .mealPlanId(r.get(field("meal_plan_id", Long.class)))
                .foodId(r.get(field("food_id", Long.class)))
                .quantityGrams(toFloat(r, "quantity_grams"))
                .checked(r.get(field("checked", Boolean.class)))
                .build();
    }
}