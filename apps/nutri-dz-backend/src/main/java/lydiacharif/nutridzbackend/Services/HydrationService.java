package lydiacharif.nutridzbackend.Services;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import lydiacharif.nutridzbackend.Dtos.request.hydration.LogWaterRequest;
import lydiacharif.nutridzbackend.Dtos.response.hydration.HydrationResponse;
import lydiacharif.nutridzbackend.Models.HydrationLog;
import lydiacharif.nutridzbackend.Models.MealLog;
import lydiacharif.nutridzbackend.Models.User;
import lydiacharif.nutridzbackend.Repositories.HydrationLogRepository;
import lydiacharif.nutridzbackend.Repositories.MealLogRepository;
import lydiacharif.nutridzbackend.Repositories.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
@RequiredArgsConstructor
@Slf4j
public class HydrationService {

    private static final float ML_PER_GLASS = 250f;

    private final HydrationLogRepository hydrationLogRepository;
    private final MealLogRepository mealLogRepository;
    private final UserRepository userRepository;

    @Transactional
    public HydrationResponse logWater(Long userId, LogWaterRequest request) {

        LocalDate today = LocalDate.now();

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));
        HydrationLog hydLog =
                hydrationLogRepository.findByUserIdAndDate(userId, today)
                        .orElseGet(() -> HydrationLog.builder()
                                .userId(userId)
                                .date(today)
                                .totalMl(0f)
                                .build());

        hydLog.setTotalMl(hydLog.getTotalMl() + request.getMlToAdd());
        hydrationLogRepository.save(hydLog);
        MealLog mealLog =
                mealLogRepository.findByUserAndDate(userId, today)
                        .orElseGet(() -> MealLog.builder()
                                .userId(userId)
                                .date(today)
                                .totalCalories(0f)
                                .totalProtein(0f)
                                .totalCarbs(0f)
                                .totalFat(0f)
                                .waterMl(0f)
                                .build());

        mealLog.setWaterMl(hydLog.getTotalMl());
        mealLogRepository.save(mealLog);

        log.info("Water logged → user={}, +{}ml, total={}ml",
                userId, request.getMlToAdd(), hydLog.getTotalMl());

        return buildResponse(hydLog, user.getDailyWaterTargetMl());
    }

    public HydrationResponse getToday(Long userId) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));

        HydrationLog hydLog =
                hydrationLogRepository.findByUserIdAndDate(userId, LocalDate.now())
                        .orElseGet(() -> HydrationLog.builder()
                                .userId(userId)
                                .date(LocalDate.now())
                                .totalMl(0f)
                                .build());

        return buildResponse(hydLog, user.getDailyWaterTargetMl());
    }

    private HydrationResponse buildResponse(HydrationLog log, Float targetMl) {

        float target = (targetMl != null) ? targetMl : 2000f;
        float total  = (log.getTotalMl() != null) ? log.getTotalMl() : 0f;

        return HydrationResponse.builder()
                .date(log.getDate())
                .totalMl(total)
                .targetMl(target)
                .glassCount((int) (total / ML_PER_GLASS))
                .progressPercent(target > 0 ? (total / target) * 100 : 0)
                .build();
    }
}