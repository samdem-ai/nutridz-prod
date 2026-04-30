package lydiacharif.nutridzbackend.Services;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import lydiacharif.nutridzbackend.Dtos.request.weight.LogWeightRequest;
import lydiacharif.nutridzbackend.Dtos.response.weight.WeightLogResponse;
import lydiacharif.nutridzbackend.Dtos.response.weight.WeightProgressResponse;
import lydiacharif.nutridzbackend.Exceptions.ResourceNotFoundException;
import lydiacharif.nutridzbackend.Exceptions.UnauthorizedActionException;
import lydiacharif.nutridzbackend.Models.User;
import lydiacharif.nutridzbackend.Models.WeightLog;
import lydiacharif.nutridzbackend.Repositories.UserRepository;
import lydiacharif.nutridzbackend.Repositories.WeightLogRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class WeightService {

    private final WeightLogRepository weightLogRepository;
    private final UserRepository userRepository;

    @Transactional
    public WeightLogResponse logWeight(Long userId, LogWeightRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));
        LocalDate date = (request.getDate() != null)
                ? request.getDate()
                : LocalDate.now();
        float bmi = calculateBmi(request.getWeightKg(), user.getHeightCm());
        WeightLog weightLog = weightLogRepository.findByUserIdAndDate(userId, date)
                .orElseGet(() -> WeightLog.builder()
                        .userId(userId)
                        .recordedOn(date)
                        .build());
        weightLog.setWeightKg(request.getWeightKg());
        weightLog.setBmi(bmi);
        user.setWeightKg(request.getWeightKg());
        userRepository.save(user);
        WeightLog saved = weightLogRepository.save(weightLog);
        log.info("Weight logged → user={}, weight={}kg, bmi={}", userId, request.getWeightKg(), bmi);
        return map(saved);
    }

    public WeightProgressResponse getProgress(Long userId) {
        List<WeightLog> history = weightLogRepository.findByUserIdOrderByDateDesc(userId, 30);

        if (history.isEmpty()) {
            return WeightProgressResponse.builder()
                    .history(List.of())
                    .build();
        }

        WeightLog latest   = history.get(0);
        WeightLog earliest = history.get(history.size() - 1);

        return WeightProgressResponse.builder()
                .currentWeight(latest.getWeightKg())
                .startingWeight(earliest.getWeightKg())
                .currentBmi(latest.getBmi())
                .weightChange(latest.getWeightKg() - earliest.getWeightKg())
                .history(history.stream().map(this::map).collect(Collectors.toList()))
                .build();
    }

    @Transactional
    public void deleteLog(Long userId, Long logId) {
        WeightLog weightLog = weightLogRepository.findById(logId)
                .orElseThrow(() -> new ResourceNotFoundException("WeightLog", logId));

        if (!weightLog.getUserId().equals(userId))
            throw new UnauthorizedActionException("delete this weight log");

        weightLogRepository.deleteById(logId);
    }

    private float calculateBmi(float weightKg, Float heightCm) {
        if (heightCm == null || heightCm == 0) return 0f;
        float heightM = heightCm / 100f;
        return weightKg / (heightM * heightM);
    }

    private WeightLogResponse map(WeightLog weightLog) {
        return WeightLogResponse.builder()
                .id(weightLog.getId())
                .weightKg(weightLog.getWeightKg())
                .bmi(weightLog.getBmi())
                .recordedOn(weightLog.getRecordedOn())
                .build();
    }
}