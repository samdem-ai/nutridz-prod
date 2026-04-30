package lydiacharif.nutridzbackend.Models;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserProfile {
    private Long id;
    private Long userId;
    private String bio;
    private String avatarUrl;
    private Integer totalLikes;
    private Integer totalRecipes;
    private Boolean isPublic;
}