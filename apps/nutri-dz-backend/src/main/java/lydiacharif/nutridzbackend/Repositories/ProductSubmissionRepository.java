package lydiacharif.nutridzbackend.Repositories;

import lydiacharif.nutridzbackend.Enums.FoodCategory;
import lydiacharif.nutridzbackend.Enums.NutritionalScore;
import lydiacharif.nutridzbackend.Enums.SubmissionStatus;
import lydiacharif.nutridzbackend.Models.ProductSubmission;
import org.jooq.*;
import org.jooq.Record;
import org.jooq.impl.DSL;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

import static org.jooq.impl.DSL.*;

@Repository
@Transactional
public class ProductSubmissionRepository {

    private static final String TABLE = "product_submissions";

    private final DSLContext dsl;

    public ProductSubmissionRepository(@Qualifier("dslContext") DSLContext dsl) {
        this.dsl = dsl;
    }

    public ProductSubmission save(ProductSubmission s) {
        Map<Field<?>, Object> values = new LinkedHashMap<>();
        values.put(field("barcode"),            s.getBarcode());
        values.put(field("code_format"),        s.getCodeFormat());
        values.put(field("name"),               s.getName());
        values.put(field("name_ar"),            s.getNameAr());
        values.put(field("brand"),              s.getBrand());
        values.put(field("category"),           s.getCategory().name());
        values.put(field("calories_per_100g"),  s.getCaloriesPer100g() != null ? s.getCaloriesPer100g() : 0f);
        values.put(field("protein_per_100g"),   s.getProteinPer100g());
        values.put(field("carbs_per_100g"),     s.getCarbsPer100g());
        values.put(field("fat_per_100g"),       s.getFatPer100g());
        values.put(field("fiber_per_100g"),     s.getFiberPer100g());
        values.put(field("sugar_per_100g"),     s.getSugarPer100g());
        values.put(field("salt_per_100g"),      s.getSaltPer100g());
        values.put(field("nutritional_score"),  s.getNutritionalScore() != null ? s.getNutritionalScore().name() : null);
        values.put(field("serving_sizes_json"), s.getServingSizesJson());
        values.put(field("product_image"),      s.getProductImage());
        values.put(field("label_image"),        s.getLabelImage());
        values.put(field("ocr_text"),           s.getOcrText());
        values.put(field("status"),             s.getStatus().name());
        values.put(field("reject_reason"),      s.getRejectReason());
        values.put(field("target_food_id"),     s.getTargetFoodId());
        values.put(field("food_id"),            s.getFoodId());
        values.put(field("reviewed_by"),        s.getReviewedBy());
        values.put(field("reviewed_at"),        s.getReviewedAt());

        if (s.getId() == null) {
            values.put(field("submitted_by"), s.getSubmittedBy());
            dsl.insertInto(table(TABLE)).set(values).execute();
            s.setId(dsl.lastID().longValue());
        } else {
            dsl.update(table(TABLE)).set(values).where(field("id").eq(s.getId())).execute();
        }
        return s;
    }

    public Optional<ProductSubmission> findById(Long id) {
        Record r = baseSelect(true).where(field("s.id").eq(id)).fetchOne();
        return Optional.ofNullable(r).map(ProductSubmissionRepository::map);
    }

    public Optional<ProductSubmission> findPendingByBarcode(String barcode) {
        Record r = baseSelect(false)
                .where(field("s.barcode").eq(barcode))
                .and(field("s.status").eq(SubmissionStatus.PENDING.name()))
                .limit(1)
                .fetchOne();
        return Optional.ofNullable(r).map(ProductSubmissionRepository::map);
    }

    /** List without the (large) label image. */
    public List<ProductSubmission> search(SubmissionStatus status, String q, int limit, int offset) {
        return baseSelect(false)
                .where(filter(status, q))
                .orderBy(status == SubmissionStatus.PENDING
                        ? field("s.created_at").asc()
                        : field("s.updated_at").desc())
                .limit(limit)
                .offset(offset)
                .fetch()
                .map(ProductSubmissionRepository::map);
    }

    public long count(SubmissionStatus status, String q) {
        return dsl.selectCount().from(table(TABLE).as("s")).where(filter(status, q)).fetchOne(0, Long.class);
    }

    public long countByStatus(SubmissionStatus status) {
        return count(status, null);
    }

    public long countCreatedSince(LocalDate day) {
        return dsl.selectCount().from(table(TABLE))
                .where(field("created_at", LocalDateTime.class).ge(day.atStartOfDay()))
                .fetchOne(0, Long.class);
    }

    /** [userId, username, submitted, approved] per contributor. */
    public List<Object[]> contributorStats() {
        Field<Long> submitted = DSL.count().cast(Long.class).as("submitted");
        Field<Long> approved = sum(when(field("s.status").eq(SubmissionStatus.APPROVED.name()), 1).otherwise(0))
                .cast(Long.class).as("approved");
        return dsl.select(field("u.id"), field("u.username"), submitted, approved)
                .from(table(TABLE).as("s"))
                .join(table("users").as("u")).on(field("u.id").eq(field("s.submitted_by")))
                .groupBy(field("u.id"), field("u.username"))
                .orderBy(field("submitted").desc())
                .limit(20)
                .fetch()
                .map(r -> new Object[]{
                        r.get(0, Long.class), r.get(1, String.class),
                        r.get(2, Long.class), r.get(3, Long.class)});
    }

    public void deleteById(Long id) {
        dsl.deleteFrom(table(TABLE)).where(field("id").eq(id)).execute();
    }

    // ───────────────────────────────────────────────────────────────

    private Condition filter(SubmissionStatus status, String q) {
        Condition c = noCondition();
        if (status != null) c = c.and(field("s.status").eq(status.name()));
        if (q != null && !q.isBlank()) {
            String like = "%" + q.trim() + "%";
            c = c.and(field("s.name").likeIgnoreCase(like)
                    .or(field("s.name_ar").likeIgnoreCase(like))
                    .or(field("s.brand").likeIgnoreCase(like))
                    .or(field("s.barcode").like(like)));
        }
        return c;
    }

    private SelectJoinStep<Record> baseSelect(boolean withLabel) {
        List<Field<?>> fields = new ArrayList<>();
        for (String col : List.of("id", "barcode", "code_format", "name", "name_ar", "brand", "category",
                "calories_per_100g", "protein_per_100g", "carbs_per_100g", "fat_per_100g",
                "fiber_per_100g", "sugar_per_100g", "salt_per_100g", "nutritional_score",
                "serving_sizes_json", "product_image", "ocr_text", "status", "reject_reason",
                "target_food_id", "food_id", "submitted_by", "reviewed_by",
                "created_at", "updated_at", "reviewed_at")) {
            fields.add(field(name("s", col)).as(col));
        }
        fields.add(field(name("su", "username")).as("submitted_by_name"));
        fields.add(field(name("ru", "username")).as("reviewed_by_name"));
        fields.add(withLabel ? field(name("s", "label_image")).as("label_image") : inline((String) null).as("label_image"));

        return dsl.select(fields)
                .from(table(TABLE).as("s")
                        .leftJoin(table("users").as("su")).on(field("su.id").eq(field("s.submitted_by")))
                        .leftJoin(table("users").as("ru")).on(field("ru.id").eq(field("s.reviewed_by"))));
    }

    private static Float f(Record r, String col) {
        Double d = r.get(col, Double.class);
        return d != null ? d.floatValue() : null;
    }

    private static <E extends Enum<E>> E e(Class<E> type, Record r, String col) {
        String v = r.get(col, String.class);
        return v != null ? Enum.valueOf(type, v) : null;
    }

    private static ProductSubmission map(Record r) {
        return ProductSubmission.builder()
                .id(r.get("id", Long.class))
                .barcode(r.get("barcode", String.class))
                .codeFormat(r.get("code_format", String.class))
                .name(r.get("name", String.class))
                .nameAr(r.get("name_ar", String.class))
                .brand(r.get("brand", String.class))
                .category(e(FoodCategory.class, r, "category"))
                .caloriesPer100g(f(r, "calories_per_100g"))
                .proteinPer100g(f(r, "protein_per_100g"))
                .carbsPer100g(f(r, "carbs_per_100g"))
                .fatPer100g(f(r, "fat_per_100g"))
                .fiberPer100g(f(r, "fiber_per_100g"))
                .sugarPer100g(f(r, "sugar_per_100g"))
                .saltPer100g(f(r, "salt_per_100g"))
                .nutritionalScore(e(NutritionalScore.class, r, "nutritional_score"))
                .servingSizesJson(r.get("serving_sizes_json", String.class))
                .productImage(r.get("product_image", String.class))
                .labelImage(r.get("label_image", String.class))
                .ocrText(r.get("ocr_text", String.class))
                .status(e(SubmissionStatus.class, r, "status"))
                .rejectReason(r.get("reject_reason", String.class))
                .targetFoodId(r.get("target_food_id", Long.class))
                .foodId(r.get("food_id", Long.class))
                .submittedBy(r.get("submitted_by", Long.class))
                .submittedByName(r.get("submitted_by_name", String.class))
                .reviewedBy(r.get("reviewed_by", Long.class))
                .reviewedByName(r.get("reviewed_by_name", String.class))
                .createdAt(r.get("created_at", LocalDateTime.class))
                .updatedAt(r.get("updated_at", LocalDateTime.class))
                .reviewedAt(r.get("reviewed_at", LocalDateTime.class))
                .build();
    }
}
