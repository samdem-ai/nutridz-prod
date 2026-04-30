package lydiacharif.nutridzbackend.Models;

import lombok.*;
import lydiacharif.nutridzbackend.Enums.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {
    private Long id;
    private Long userId;
    private NotificationType type;
    private String title;
    private String body;
    private Boolean isRead;
    private LocalDateTime scheduledAt;
}