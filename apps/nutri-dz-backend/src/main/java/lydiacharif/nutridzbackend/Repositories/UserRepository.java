package lydiacharif.nutridzbackend.Repositories;

import lydiacharif.nutridzbackend.Enums.*;
import lydiacharif.nutridzbackend.Models.User;
import org.jooq.DSLContext;
import org.jooq.Record;
import org.jooq.Result;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.security.crypto.password.PasswordEncoder;
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
public class UserRepository {

    private final DSLContext dslContext;
    private final PasswordEncoder passwordEncoder;
    private static final String TABLE_NAME = "users";

    public UserRepository(@Qualifier("dslContext") DSLContext dslContext, PasswordEncoder passwordEncoder) {
        this.dslContext = dslContext;
        this.passwordEncoder = passwordEncoder;
    }

    public User save(User user) {
        if (user.getId() == null) {
            dslContext.insertInto(table(TABLE_NAME))
                    .set(field("username"),              user.getUsername())
                    .set(field("email"),                 user.getEmail())
                    .set(field("password_hash"),         user.getPasswordHash())
                    .set(field("role"),                  user.getRole().name())
                    .set(field("gender"),                user.getGender() != null ? user.getGender().name() : null)
                    .set(field("birth_date"),            user.getBirthDate())
                    .set(field("height_cm"),             user.getHeightCm())
                    .set(field("weight_kg"),             user.getWeightKg())
                    .set(field("activity_level"),        user.getActivityLevel() != null ? user.getActivityLevel().name() : null)
                    .set(field("work_type"),             user.getWorkType() != null ? user.getWorkType().name() : null)
                    .set(field("workout_type"),          user.getWorkoutType() != null ? user.getWorkoutType().name() : null)
                    .set(field("diabetes_type"),         user.getDiabetesType() != null ? user.getDiabetesType().name() : DiabetesType.NONE.name())
                    .set(field("allergies"),             user.getAllergies())
                    .set(field("nutrition_goal"),        user.getNutritionGoal() != null ? user.getNutritionGoal().name() : null)
                    .set(field("daily_calorie_target"),  user.getDailyCalorieTarget())
                    .set(field("daily_protein_target"),  user.getDailyProteinTarget())
                    .set(field("daily_carb_target"),     user.getDailyCarbTarget())
                    .set(field("daily_fat_target"),      user.getDailyFatTarget())
                    .set(field("daily_water_target_ml"), user.getDailyWaterTargetMl())
                    .set(field("avatar_url"),            user.getAvatarUrl())
                    .set(field("created_at"),            LocalDateTime.now())
                    .execute();
            user.setId(dslContext.lastID().longValue());
        } else {
            dslContext.update(table(TABLE_NAME))
                    .set(field("username"),              user.getUsername())
                    .set(field("email"),                 user.getEmail())
                    .set(field("password_hash"),         user.getPasswordHash())
                    .set(field("role"),                  user.getRole().name())
                    .set(field("gender"),                user.getGender() != null ? user.getGender().name() : null)
                    .set(field("birth_date"),            user.getBirthDate())
                    .set(field("height_cm"),             user.getHeightCm())
                    .set(field("weight_kg"),             user.getWeightKg())
                    .set(field("activity_level"),        user.getActivityLevel() != null ? user.getActivityLevel().name() : null)
                    .set(field("work_type"),             user.getWorkType() != null ? user.getWorkType().name() : null)
                    .set(field("workout_type"),          user.getWorkoutType() != null ? user.getWorkoutType().name() : null)
                    .set(field("diabetes_type"),         user.getDiabetesType() != null ? user.getDiabetesType().name() : DiabetesType.NONE.name())
                    .set(field("allergies"),             user.getAllergies())
                    .set(field("nutrition_goal"),        user.getNutritionGoal() != null ? user.getNutritionGoal().name() : null)
                    .set(field("daily_calorie_target"),  user.getDailyCalorieTarget())
                    .set(field("daily_protein_target"),  user.getDailyProteinTarget())
                    .set(field("daily_carb_target"),     user.getDailyCarbTarget())
                    .set(field("daily_fat_target"),      user.getDailyFatTarget())
                    .set(field("daily_water_target_ml"), user.getDailyWaterTargetMl())
                    .set(field("avatar_url"),            user.getAvatarUrl())
                    .where(field("id").eq(user.getId()))
                    .execute();
        }
        return user;
    }

    public void deleteById(Long userId) {
        dslContext.deleteFrom(table(TABLE_NAME))
                .where(field("id").eq(userId))
                .execute();
    }

    public List<User> findAll() {
        Result<Record> result = dslContext.select()
                .from(table(TABLE_NAME))
                .fetch();

        List<User> users = new ArrayList<>();
        for (Record record : result) {
            users.add(mapToUser(record));
        }
        return users;
    }

    public Optional<User> findById(Long id) {
        Record record = dslContext.select()
                .from(table(TABLE_NAME))
                .where(field("id").eq(id))
                .fetchOne();

        return record != null ? Optional.of(mapToUser(record)) : Optional.empty();
    }

    public Optional<User> findByEmail(String email) {
        Record record = dslContext.select()
                .from(table(TABLE_NAME))
                .where(field("email").eq(email))
                .fetchOne();

        return record != null ? Optional.of(mapToUser(record)) : Optional.empty();
    }

    public Optional<User> findByUsername(String username) {
        Record record = dslContext.select()
                .from(table(TABLE_NAME))
                .where(field("username").eq(username))
                .fetchOne();

        return record != null ? Optional.of(mapToUser(record)) : Optional.empty();
    }

    public boolean existsByEmail(String email) {
        return findByEmail(email).isPresent();
    }

    public boolean existsByUsername(String username) {
        return findByUsername(username).isPresent();
    }

    public Optional<User> authenticate(String email, String password) {
        Optional<User> userOptional = findByEmail(email);
        if (userOptional.isPresent()) {
            User user = userOptional.get();
            if (passwordEncoder.matches(password, user.getPasswordHash())) {
                return Optional.of(user);
            }
        }
        return Optional.empty();
    }

    public long count() {
        Integer count = dslContext.selectCount()
                .from(table(TABLE_NAME))
                .fetchOne(0, Integer.class);
        return count != null ? count : 0;
    }

    // ── Helpers ────────────────────────────────────────────────

    private static LocalDateTime toLocalDateTime(Object raw) {
        if (raw == null) return null;
        if (raw instanceof LocalDateTime ldt) return ldt;
        if (raw instanceof Timestamp ts) return ts.toLocalDateTime();
        throw new IllegalStateException("Unexpected type for DATETIME column: " + raw.getClass().getName());
    }

    // MySQL returns java.sql.Date for DATE columns
    private static LocalDate toLocalDate(Object raw) {
        if (raw == null) return null;
        if (raw instanceof LocalDate ld) return ld;
        if (raw instanceof Date d) return d.toLocalDate();
        throw new IllegalStateException("Unexpected type for DATE column: " + raw.getClass().getName());
    }

    private static <E extends Enum<E>> E toEnum(Class<E> enumClass, Record record, String column) {
        String val = record.get(field(column, String.class));
        return val != null ? Enum.valueOf(enumClass, val) : null;
    }

    private User mapToUser(Record record) {
        return User.builder()
                .id(record.get(field("id", Long.class)))
                .username(record.get(field("username", String.class)))
                .email(record.get(field("email", String.class)))
                .passwordHash(record.get(field("password_hash", String.class)))
                .role(toEnum(Role.class, record, "role"))
                .gender(toEnum(Gender.class, record, "gender"))
                .birthDate(toLocalDate(record.get(field("birth_date"))))
                .heightCm(toFloat(record.get(field("height_cm"))))
                .weightKg(toFloat(record.get(field("weight_kg"))))
                .activityLevel(toEnum(ActivityLevel.class, record, "activity_level"))
                .workType(toEnum(WorkType.class, record, "work_type"))
                .workoutType(toEnum(WorkoutType.class, record, "workout_type"))
                .diabetesType(toEnum(DiabetesType.class, record, "diabetes_type"))
                .allergies(record.get(field("allergies", String.class)))
                .nutritionGoal(toEnum(NutritionGoal.class, record, "nutrition_goal"))
                .dailyCalorieTarget(toFloat(record.get(field("daily_calorie_target"))))
                .dailyProteinTarget(toFloat(record.get(field("daily_protein_target"))))
                .dailyCarbTarget(toFloat(record.get(field("daily_carb_target"))))
                .dailyFatTarget(toFloat(record.get(field("daily_fat_target"))))
                .dailyWaterTargetMl(toFloat(record.get(field("daily_water_target_ml"))))
                .avatarUrl(record.get(field("avatar_url", String.class)))
                .createdAt(toLocalDateTime(record.get(field("created_at"))))
                .build();
    }

    private static Float toFloat(Object raw) {
        if (raw == null) return null;
        if (raw instanceof Float f) return f;
        if (raw instanceof Double d) return d.floatValue();
        if (raw instanceof Number n) return n.floatValue();
        return null;
    }
}