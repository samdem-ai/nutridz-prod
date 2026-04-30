package lydiacharif.nutridzbackend.Repositories;

import lydiacharif.nutridzbackend.Models.HydrationLog;
import org.jooq.DSLContext;
import org.jooq.Record;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Date;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.jooq.impl.DSL.field;
import static org.jooq.impl.DSL.table;

@Repository
@Transactional
public class HydrationLogRepository {

    private final DSLContext dsl;
    private static final String TABLE = "hydration_logs";

    public HydrationLogRepository(DSLContext dsl) {
        this.dsl = dsl;
    }

    public HydrationLog save(HydrationLog log) {
        if (log.getId() == null) {
            dsl.insertInto(table(TABLE))
                    .set(field("user_id"),    log.getUserId())
                    .set(field("date"),       log.getDate())
                    .set(field("total_ml"),   log.getTotalMl())
                    .set(field("updated_at"), LocalDateTime.now())
                    .execute();
            log.setId(dsl.lastID().longValue());
        } else {
            dsl.update(table(TABLE))
                    .set(field("total_ml"),   log.getTotalMl())
                    .set(field("updated_at"), LocalDateTime.now())
                    .where(field("id").eq(log.getId()))
                    .execute();
        }
        return log;
    }

    public Optional<HydrationLog> findByUserIdAndDate(Long userId, LocalDate date) {
        Record record = dsl.select()
                .from(table(TABLE))
                .where(field("user_id").eq(userId))
                .and(field("date").eq(date))
                .fetchOne();
        return record != null ? Optional.of(map(record)) : Optional.empty();
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

    private HydrationLog map(Record record) {
        return HydrationLog.builder()
                .id(record.get(field("id", Long.class)))
                .userId(record.get(field("user_id", Long.class)))
                .date(toLocalDate(record.get(field("date"))))
                .totalMl(toFloat(record, "total_ml"))
                .build();
    }
}