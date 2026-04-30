package lydiacharif.nutridzbackend.Repositories;

import lydiacharif.nutridzbackend.Models.WeightLog;
import org.jooq.DSLContext;
import org.jooq.Record;
import org.jooq.Result;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Date;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.jooq.impl.DSL.field;
import static org.jooq.impl.DSL.table;

@Repository
@Transactional
public class WeightLogRepository {

    private final DSLContext dsl;
    private static final String TABLE = "weight_logs";

    public WeightLogRepository(DSLContext dsl) {
        this.dsl = dsl;
    }

    public WeightLog save(WeightLog log) {
        if (log.getId() == null) {
            dsl.insertInto(table(TABLE))
                    .set(field("user_id"),     log.getUserId())
                    .set(field("weight_kg"),   log.getWeightKg())
                    .set(field("bmi"),         log.getBmi())
                    .set(field("recorded_on"), log.getRecordedOn())
                    .set(field("created_at"),  LocalDateTime.now())
                    .execute();
            log.setId(dsl.lastID().longValue());
        } else {
            dsl.update(table(TABLE))
                    .set(field("weight_kg"), log.getWeightKg())
                    .set(field("bmi"),       log.getBmi())
                    .where(field("id").eq(log.getId()))
                    .execute();
        }
        return log;
    }

    public Optional<WeightLog> findById(Long id) {
        Record record = dsl.select()
                .from(table(TABLE))
                .where(field("id").eq(id))
                .fetchOne();
        return record != null ? Optional.of(map(record)) : Optional.empty();
    }

    public List<WeightLog> findByUserIdOrderByDateDesc(Long userId, int limit) {
        Result<Record> result = dsl.select()
                .from(table(TABLE))
                .where(field("user_id").eq(userId))
                .orderBy(field("recorded_on").desc())
                .limit(limit)
                .fetch();

        List<WeightLog> logs = new ArrayList<>();
        for (Record record : result) logs.add(map(record));
        return logs;
    }

    public Optional<WeightLog> findByUserIdAndDate(Long userId, LocalDate date) {
        Record record = dsl.select()
                .from(table(TABLE))
                .where(field("user_id").eq(userId))
                .and(field("recorded_on").eq(date))
                .fetchOne();
        return record != null ? Optional.of(map(record)) : Optional.empty();
    }

    public void deleteById(Long id) {
        dsl.deleteFrom(table(TABLE))
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

    private WeightLog map(Record record) {
        return WeightLog.builder()
                .id(record.get(field("id", Long.class)))
                .userId(record.get(field("user_id", Long.class)))
                .weightKg(toFloat(record, "weight_kg"))
                .bmi(toFloat(record, "bmi"))
                .recordedOn(toLocalDate(record.get(field("recorded_on"))))
                .build();
    }
}