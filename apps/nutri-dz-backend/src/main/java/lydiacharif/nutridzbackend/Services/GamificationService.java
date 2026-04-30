package lydiacharif.nutridzbackend.Services;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jooq.DSLContext;
import org.jooq.Record;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;

import static org.jooq.impl.DSL.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class GamificationService {

    @Qualifier("dslContext")
    private final DSLContext dsl;

    /** Update streak after a successful journal log. Returns updated streak info. */
    @Transactional
    public Map<String, Object> recordActivity(Long userId, LocalDate today) {
        Record existing = dsl.select()
                .from(table("user_streaks"))
                .where(field("user_id").eq(userId))
                .fetchOne();

        int current = 0, longest = 0;
        LocalDate lastDate = null;

        if (existing != null) {
            current = existing.get(field("current_streak", Integer.class));
            longest = existing.get(field("longest_streak", Integer.class));
            lastDate = toLocalDate(existing.get(field("last_log_date")));
        }

        if (lastDate == null) {
            current = 1;
        } else if (lastDate.equals(today)) {
            // Same day — no change
        } else if (lastDate.plusDays(1).equals(today)) {
            current += 1;
        } else {
            // Streak broken
            current = 1;
        }
        longest = Math.max(longest, current);

        if (existing == null) {
            dsl.insertInto(table("user_streaks"))
                    .set(field("user_id"), userId)
                    .set(field("current_streak", Integer.class), current)
                    .set(field("longest_streak", Integer.class), longest)
                    .set(field("last_log_date", LocalDate.class), today)
                    .execute();
        } else {
            dsl.update(table("user_streaks"))
                    .set(field("current_streak", Integer.class), current)
                    .set(field("longest_streak", Integer.class), longest)
                    .set(field("last_log_date", LocalDate.class), today)
                    .where(field("user_id").eq(userId))
                    .execute();
        }

        // Check streak achievements
        if (current == 3) unlock(userId, "streak_3");
        if (current == 7) unlock(userId, "streak_7");
        if (current == 30) unlock(userId, "streak_30");
        if (current == 100) unlock(userId, "streak_100");

        return Map.of(
                "currentStreak", current,
                "longestStreak", longest,
                "lastLogDate", today.toString()
        );
    }

    public Map<String, Object> getStreak(Long userId) {
        Record r = dsl.select()
                .from(table("user_streaks"))
                .where(field("user_id").eq(userId))
                .fetchOne();
        if (r == null) return Map.of("currentStreak", 0, "longestStreak", 0, "lastLogDate", null);

        // Streak might be stale if user missed a day
        LocalDate last = toLocalDate(r.get(field("last_log_date")));
        int current = r.get(field("current_streak", Integer.class));
        int longest = r.get(field("longest_streak", Integer.class));
        if (last != null && ChronoUnit.DAYS.between(last, LocalDate.now()) > 1) {
            current = 0;
        }
        return Map.of(
                "currentStreak", current,
                "longestStreak", longest,
                "lastLogDate", last != null ? last.toString() : null
        );
    }

    public void unlock(Long userId, String achievementId) {
        try {
            dsl.insertInto(table("user_achievements"))
                    .set(field("user_id"), userId)
                    .set(field("achievement_id"), achievementId)
                    .execute();
            log.info("User {} unlocked achievement {}", userId, achievementId);
        } catch (Exception e) {
            // Already unlocked — silent
        }
    }

    /** Run achievement checks based on cumulative counts. */
    @Transactional
    public List<String> checkCountBased(Long userId, String category) {
        List<String> newlyUnlocked = new ArrayList<>();
        // Count actions for this user in this category
        if ("JOURNAL".equals(category)) {
            int count = countRows("journal_entries", userId);
            if (count >= 1) tryUnlock(userId, "first_log", newlyUnlocked);
            if (count >= 10) tryUnlock(userId, "logs_10", newlyUnlocked);
            if (count >= 50) tryUnlock(userId, "logs_50", newlyUnlocked);
            if (count >= 100) tryUnlock(userId, "logs_100", newlyUnlocked);
        } else if ("WEIGHT".equals(category)) {
            int count = countRows("weight_logs", userId);
            if (count >= 1) tryUnlock(userId, "weight_log", newlyUnlocked);
            if (count >= 5) tryUnlock(userId, "weight_5", newlyUnlocked);
        } else if ("AI_PHOTO".equals(category)) {
            int count = dsl.fetchCount(
                    select().from(table("journal_entries"))
                            .where(field("user_id").eq(userId))
                            .and(field("log_source").eq("AI_PHOTO"))
            );
            if (count >= 1) tryUnlock(userId, "photo_1", newlyUnlocked);
            if (count >= 10) tryUnlock(userId, "photo_10", newlyUnlocked);
        } else if ("BARCODE".equals(category)) {
            int count = dsl.fetchCount(
                    select().from(table("journal_entries"))
                            .where(field("user_id").eq(userId))
                            .and(field("log_source").eq("BARCODE_SCAN"))
            );
            if (count >= 5) tryUnlock(userId, "barcode_5", newlyUnlocked);
        } else if ("CHAT".equals(category)) {
            tryUnlock(userId, "chat_1", newlyUnlocked);
        } else if ("RECIPE".equals(category)) {
            int count = dsl.fetchCount(select().from(table("recipes")).where(field("author_id").eq(userId)));
            if (count >= 1) tryUnlock(userId, "recipe_share", newlyUnlocked);
        } else if ("PLAN".equals(category)) {
            tryUnlock(userId, "plan_1", newlyUnlocked);
        }
        return newlyUnlocked;
    }

    private static LocalDate toLocalDate(Object o) {
        if (o == null) return null;
        if (o instanceof LocalDate d) return d;
        if (o instanceof java.sql.Date sd) return sd.toLocalDate();
        if (o instanceof java.util.Date ud) return ud.toInstant().atZone(java.time.ZoneId.systemDefault()).toLocalDate();
        return LocalDate.parse(o.toString());
    }

    private int countRows(String table, Long userId) {
        return dsl.fetchCount(select().from(table(table)).where(field("user_id").eq(userId)));
    }

    private void tryUnlock(Long userId, String id, List<String> out) {
        Integer existing = dsl.fetchCount(select().from(table("user_achievements"))
                .where(field("user_id").eq(userId)).and(field("achievement_id").eq(id)));
        if (existing == 0) {
            unlock(userId, id);
            out.add(id);
        }
    }

    public Map<String, Object> getAchievements(Long userId) {
        // All achievements
        var all = dsl.select().from(table("achievements")).fetch();
        // Unlocked IDs
        var unlocked = dsl.select(field("achievement_id", String.class), field("unlocked_at"))
                .from(table("user_achievements"))
                .where(field("user_id").eq(userId))
                .fetch();
        Map<String, Object> unlockedMap = new HashMap<>();
        for (Record r : unlocked) {
            unlockedMap.put(r.get(field("achievement_id", String.class)),
                    r.get(field("unlocked_at")) != null ? r.get(field("unlocked_at")).toString() : null);
        }

        List<Map<String, Object>> items = new ArrayList<>();
        for (Record a : all) {
            String id = a.get(field("id", String.class));
            Map<String, Object> item = new HashMap<>();
            item.put("id", id);
            item.put("title", a.get(field("title", String.class)));
            item.put("description", a.get(field("description", String.class)));
            item.put("icon", a.get(field("icon", String.class)));
            item.put("category", a.get(field("category", String.class)));
            item.put("unlocked", unlockedMap.containsKey(id));
            item.put("unlockedAt", unlockedMap.get(id));
            items.add(item);
        }

        return Map.of(
                "total", all.size(),
                "unlocked", unlockedMap.size(),
                "achievements", items
        );
    }
}
