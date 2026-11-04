package lydiacharif.nutridzbackend.Repositories;

import lydiacharif.nutridzbackend.Enums.FoodCategory;
import org.jooq.Condition;
import org.jooq.DSLContext;
import org.jooq.Record;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.jooq.impl.DSL.*;

/** Admin-only queries on foods: paging, stats, and product photos. */
@Repository
@Transactional
public class AdminFoodRepository {

    private final DSLContext dsl;

    public AdminFoodRepository(@Qualifier("dslContext") DSLContext dsl) {
        this.dsl = dsl;
    }

    /** Ids of foods matching the filters, newest first. */
    public List<Long> searchIds(String q, FoodCategory category, Boolean verified, Boolean hasBarcode,
                                int limit, int offset) {
        return dsl.select(field("id", Long.class))
                .from(table("foods"))
                .where(filter(q, category, verified, hasBarcode))
                .orderBy(field("id").desc())
                .limit(limit)
                .offset(offset)
                .fetch(field("id", Long.class));
    }

    public long count(String q, FoodCategory category, Boolean verified, Boolean hasBarcode) {
        return dsl.selectCount().from(table("foods"))
                .where(filter(q, category, verified, hasBarcode))
                .fetchOne(0, Long.class);
    }

    public Map<String, Long> countByCategory() {
        Map<String, Long> out = new LinkedHashMap<>();
        dsl.select(field("category", String.class), org.jooq.impl.DSL.count())
                .from(table("foods"))
                .groupBy(field("category"))
                .fetch()
                .forEach(r -> out.put(r.value1(), r.value2().longValue()));
        return out;
    }

    public void deleteServingSizes(Long foodId) {
        dsl.deleteFrom(table("food_serving_sizes")).where(field("food_id").eq(foodId)).execute();
    }

    public void saveImage(Long foodId, String mimeType, byte[] data) {
        dsl.insertInto(table("food_images"))
                .set(field("food_id"), foodId)
                .set(field("mime_type"), mimeType)
                .set(field("data"), data)
                .onDuplicateKeyUpdate()
                .set(field("mime_type"), mimeType)
                .set(field("data"), data)
                .execute();
    }

    public Optional<StoredImage> findImage(Long foodId) {
        Record r = dsl.select(field("mime_type"), field("data"))
                .from(table("food_images"))
                .where(field("food_id").eq(foodId))
                .fetchOne();
        if (r == null) return Optional.empty();
        return Optional.of(new StoredImage(r.get(0, String.class), r.get(1, byte[].class)));
    }

    public record StoredImage(String mimeType, byte[] data) {}

    private Condition filter(String q, FoodCategory category, Boolean verified, Boolean hasBarcode) {
        Condition c = noCondition();
        if (q != null && !q.isBlank()) {
            String like = "%" + q.trim() + "%";
            c = c.and(field("name").likeIgnoreCase(like)
                    .or(field("name_ar").likeIgnoreCase(like))
                    .or(field("brand").likeIgnoreCase(like))
                    .or(field("barcode").like(like)));
        }
        if (category != null) c = c.and(field("category").eq(category.name()));
        if (verified != null) c = c.and(field("verified").eq(verified ? 1 : 0));
        if (hasBarcode != null) {
            c = c.and(hasBarcode
                    ? field("barcode").isNotNull().and(field("barcode").ne(""))
                    : field("barcode").isNull().or(field("barcode").eq("")));
        }
        return c;
    }
}
