package lydiacharif.nutridzbackend.Models;

import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RecipeComment {
    private Long id;
    private Long userId;
    private Long recipeId;
    private String content;
    private LocalDateTime createdAt;
}