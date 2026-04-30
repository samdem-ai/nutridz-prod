package lydiacharif.nutridzbackend.Repositories;

import lydiacharif.nutridzbackend.Models.MealLog;
import org.jooq.DSLContext;
import org.jooq.Record;
import org.jooq.Result;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Date;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.jooq.impl.DSL.field;
import static org.jooq.impl.DSL.table;

@Repository
@Transactional
public class MealLogRepository {

    private final DSLContext dslContext;
    private static final String TABLE = "meal_logs";

    public MealLogRepository(@Qualifier("dslContext") DSLContext dslContext) {
        this.dslContext = dslContext;
    }

    public MealLog save(MealLog log) {
        if (log.getId() == null) {
            dslContext.insertInto(table(TABLE))
                    .set(field("user_id"),        log.getUserId())
                    .set(field("date"),           log.getDate())
                    .set(field("total_calories"), log.getTotalCalories())
                    .set(field("total_protein"),  log.getTotalProtein())
                    .set(field("total_carbs"),    log.getTotalCarbs())
                    .set(field("total_fat"),      log.getTotalFat())
                    .set(field("water_ml"),       log.getWaterMl())
                    .execute();
            log.setId(dslContext.lastID().longValue());
        } else {
            dslContext.update(table(TABLE))
                    .set(field("total_calories"), log.getTotalCalories())
                    .set(field("total_protein"),  log.getTotalProtein())
                    .set(field("total_carbs"),    log.getTotalCarbs())
                    .set(field("total_fat"),      log.getTotalFat())
                    .set(field("water_ml"),       log.getWaterMl())
                    .where(field("id").eq(log.getId()))
                    .execute();
        }
        return log;
    }

    public Optional<MealLog> findByUserAndDate(Long userId, LocalDate date) {
        Record record = dslContext.select()
                .from(table(TABLE))
                .where(field("user_id").eq(userId)
                        .and(field("date").eq(date)))
                .fetchOne();
        return record != null ? Optional.of(mapToLog(record)) : Optional.empty();
    }

    public List<MealLog> findByUserBetweenDates(Long userId, LocalDate from, LocalDate to) {
        Result<Record> result = dslContext.select()
                .from(table(TABLE))
                .where(field("user_id").eq(userId)
                        .and(field("date").between(from, to)))
                .orderBy(field("date").asc())
                .fetch();

        List<MealLog> logs = new ArrayList<>();
        for (Record r : result) logs.add(mapToLog(r));
        return logs;
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

    private MealLog mapToLog(Record r) {
        return MealLog.builder()
                .id(r.get(field("id", Long.class)))
                .userId(r.get(field("user_id", Long.class)))
                .date(toLocalDate(r.get(field("date"))))
                .totalCalories(toFloat(r, "total_calories"))
                .totalProtein(toFloat(r, "total_protein"))
                .totalCarbs(toFloat(r, "total_carbs"))
                .totalFat(toFloat(r, "total_fat"))
                .waterMl(toFloat(r, "water_ml"))
                .build();
    }
}