package lydiacharif.nutridzbackend.Repositories;

import lydiacharif.nutridzbackend.Enums.MessageRole;
import lydiacharif.nutridzbackend.Models.ChatMessage;
import org.jooq.DSLContext;
import org.jooq.Record;
import org.jooq.Result;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import static org.jooq.impl.DSL.field;
import static org.jooq.impl.DSL.table;

@Repository
@Transactional
public class ChatMessageRepository {

    private final DSLContext dsl;
    private static final String TABLE = "chat_messages";

    public ChatMessageRepository(@Qualifier("dslContext") DSLContext dsl) {
        this.dsl = dsl;
    }

    public ChatMessage save(ChatMessage message) {
        dsl.insertInto(table(TABLE))
                .set(field("user_id"), message.getUserId())
                .set(field("role"),    message.getRole().name())
                .set(field("content"), message.getContent())
                .set(field("sent_at"), LocalDateTime.now())
                .execute();
        message.setId(dsl.lastID().longValue());
        return message;
    }

    public List<ChatMessage> findByUserIdOrderedAsc(Long userId, int limit) {
        Result<Record> result = dsl.select().from(table(TABLE))
                .where(field("user_id").eq(userId))
                .orderBy(field("sent_at").desc())
                .limit(limit)
                .fetch();

        List<ChatMessage> list = new ArrayList<>();
        for (Record r : result) list.add(0, map(r));
        return list;
    }

    public List<ChatMessage> findByUserId(Long userId) {
        Result<Record> result = dsl.select().from(table(TABLE))
                .where(field("user_id").eq(userId))
                .orderBy(field("sent_at").asc())
                .fetch();
        List<ChatMessage> list = new ArrayList<>();
        for (Record r : result) list.add(map(r));
        return list;
    }

    public void deleteByUserId(Long userId) {
        dsl.deleteFrom(table(TABLE))
                .where(field("user_id").eq(userId))
                .execute();
    }

    private static LocalDateTime toLocalDateTime(Object raw) {
        if (raw == null) return null;
        if (raw instanceof LocalDateTime ldt) return ldt;
        if (raw instanceof Timestamp ts) return ts.toLocalDateTime();
        return null;
    }

    private ChatMessage map(Record r) {
        return ChatMessage.builder()
                .id(r.get(field("id", Long.class)))
                .userId(r.get(field("user_id", Long.class)))
                .role(MessageRole.valueOf(r.get(field("role", String.class))))
                .content(r.get(field("content", String.class)))
                .sentAt(toLocalDateTime(r.get(field("sent_at"))))
                .build();
    }
}