package lydiacharif.nutridzbackend.Dtos.response.admin;

import lombok.*;

import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminStatsResponse {
    private long totalFoods;
    private long verifiedFoods;
    private long foodsWithBarcode;
    private long pending;
    private long approved;
    private long rejected;
    private long submittedToday;
    private Map<String, Long> foodsByCategory;
    private List<ContributorStat> contributors;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ContributorStat {
        private Long userId;
        private String username;
        private long submitted;
        private long approved;
    }
}
