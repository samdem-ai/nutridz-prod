package lydiacharif.nutridzbackend.Models;

import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RecipeLike {
    private Long id;
    private Long userId;
    private Long recipeId;
    private LocalDateTime likedAt;
}