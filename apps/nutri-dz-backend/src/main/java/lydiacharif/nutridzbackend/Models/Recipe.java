package lydiacharif.nutridzbackend.Models;

import lombok.*;
import lydiacharif.nutridzbackend.Enums.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Recipe {
    private Long id;
    private Long authorId;
    private String title;
    private String titleAr;
    private String description;
    private String imageUrl;
    private Integer prepTimeMinutes;
    private Integer servings;
    private Float caloriesPerServing;
    private Float proteinPerServing;
    private Float carbsPerServing;
    private Float fatPerServing;
    private RecipeCategory category;
    private Boolean isAlgerian;
    private Boolean isPublic;
    private Integer likesCount;
    private LocalDateTime createdAt;
}