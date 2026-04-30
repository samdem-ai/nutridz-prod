package lydiacharif.nutridzbackend.Repositories;

import lydiacharif.nutridzbackend.Enums.*;
import lydiacharif.nutridzbackend.Models.JournalEntry;
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
public class JournalEntryRepository {

    private final DSLContext dslContext;
    private static final String TABLE = "journal_entries";

    public JournalEntryRepository(@Qualifier("dslContext") DSLContext dslContext) {
        this.dslContext = dslContext;
    }

    public JournalEntry save(JournalEntry entry) {
        if (entry.getId() == null) {
            dslContext.insertInto(table(TABLE))
                    .set(field("user_id"),            entry.getUserId())
                    .set(field("date"),               entry.getDate())
                    .set(field("meal_type"),          entry.getMealType().name())
                    .set(field("food_id"),            entry.getFoodId())
                    .set(field("recipe_id"),          entry.getRecipeId())
                    .set(field("quantity_grams"),     entry.getQuantityGrams())
                    .set(field("calories_consumed"),  entry.getCaloriesConsumed())
                    .set(field("protein_consumed"),   entry.getProteinConsumed())
                    .set(field("carbs_consumed"),     entry.getCarbsConsumed())
                    .set(field("fat_consumed"),       entry.getFatConsumed())
                    .set(field("log_source"),         entry.getLogSource().name())
                    .set(field("logged_at"),          LocalDateTime.now())
                    .execute();
            entry.setId(dslContext.lastID().longValue());
        } else {
            dslContext.update(table(TABLE))
                    .set(field("quantity_grams"),    entry.getQuantityGrams())
                    .set(field("calories_consumed"), entry.getCaloriesConsumed())
                    .set(field("protein_consumed"),  entry.getProteinConsumed())
                    .set(field("carbs_consumed"),    entry.getCarbsConsumed())
                    .set(field("fat_consumed"),      entry.getFatConsumed())
                    .where(field("id").eq(entry.getId()))
                    .execute();
        }
        return entry;
    }

    public Optional<JournalEntry> findById(Long id) {
        Record record = dslContext.select()
                .from(table(TABLE))
                .where(field("id").eq(id))
                .fetchOne();
        return record != null ? Optional.of(mapToEntry(record)) : Optional.empty();
    }

    public List<JournalEntry> findByUserAndDate(Long userId, LocalDate date) {
        Result<Record> result = dslContext.select()
                .from(table(TABLE))
                .where(field("user_id").eq(userId)
                        .and(field("date").eq(date)))
                .orderBy(field("logged_at").asc())
                .fetch();

        List<JournalEntry> entries = new ArrayList<>();
        for (Record r : result) entries.add(mapToEntry(r));
        return entries;
    }

    public List<JournalEntry> findByUserDateAndMealType(Long userId, LocalDate date, MealType mealType) {
        Result<Record> result = dslContext.select()
                .from(table(TABLE))
                .where(field("user_id").eq(userId)
                        .and(field("date").eq(date))
                        .and(field("meal_type").eq(mealType.name())))
                .orderBy(field("logged_at").asc())
                .fetch();

        List<JournalEntry> entries = new ArrayList<>();
        for (Record r : result) entries.add(mapToEntry(r));
        return entries;
    }

    public List<JournalEntry> findByUserBetweenDates(Long userId, LocalDate from, LocalDate to) {
        Result<Record> result = dslContext.select()
                .from(table(TABLE))
                .where(field("user_id").eq(userId)
                        .and(field("date").between(from, to)))
                .orderBy(field("date").asc(), field("logged_at").asc())
                .fetch();

        List<JournalEntry> entries = new ArrayList<>();
        for (Record r : result) entries.add(mapToEntry(r));
        return entries;
    }

    public void deleteById(Long id) {
        dslContext.deleteFrom(table(TABLE))
                .where(field("id").eq(id))
                .execute();
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

    private JournalEntry mapToEntry(Record r) {
        return JournalEntry.builder()
                .id(r.get(field("id", Long.class)))
                .userId(r.get(field("user_id", Long.class)))
                .date(toLocalDate(r.get(field("date"))))
                .mealType(MealType.valueOf(r.get(field("meal_type", String.class))))
                .foodId(r.get(field("food_id", Long.class)))
                .recipeId(r.get(field("recipe_id", Long.class)))
                .quantityGrams(toFloat(r, "quantity_grams"))
                .caloriesConsumed(toFloat(r, "calories_consumed"))
                .proteinConsumed(toFloat(r, "protein_consumed"))
                .carbsConsumed(toFloat(r, "carbs_consumed"))
                .fatConsumed(toFloat(r, "fat_consumed"))
                .logSource(LogSource.valueOf(r.get(field("log_source", String.class))))
                .loggedAt(toLocalDateTime(r.get(field("logged_at"))))
                .build();
    }
}