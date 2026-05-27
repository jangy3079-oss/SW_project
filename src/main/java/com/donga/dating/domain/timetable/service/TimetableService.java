package com.donga.dating.domain.timetable.service;

import com.donga.dating.domain.timetable.dto.FreeTimeSlotDto;
import com.donga.dating.domain.timetable.entity.FreeTimeSlot;
import com.donga.dating.domain.timetable.repository.FreeTimeSlotRepository;
import com.donga.dating.domain.user.entity.User;
import com.donga.dating.domain.user.repository.UserRepository;
import com.donga.dating.global.exception.CustomException;
import com.donga.dating.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class TimetableService {

    private final FreeTimeSlotRepository freeTimeSlotRepository;
    private final UserRepository userRepository;
    private final RestTemplate restTemplate;

    @Value("${timetable.analysis.url}")
    private String analysisUrl;

    private static final DateTimeFormatter TIME_FMT = DateTimeFormatter.ofPattern("HH:mm");

    // ── 시간표 업로드 및 공강시간 저장 ──────────────────────────────

    /**
     * 1. FastAPI에 이미지 전송 → 공강시간 분석 결과 수신
     * 2. 기존 공강시간 전체 삭제 후 새로 저장
     * 3. 저장된 공강시간 반환
     */
    @Transactional
    public FreeTimeSlotDto.WeeklyResponse uploadTimetable(Long userId, MultipartFile imageFile) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        // FastAPI 분석 요청
        Map<String, List<Map<String, String>>> analysisResult = callAnalysisService(imageFile);

        // 기존 공강시간 삭제 (재업로드 시 전체 교체)
        freeTimeSlotRepository.deleteByUserUserId(userId);

        // 분석 결과 저장
        List<FreeTimeSlot> slots = buildSlots(user, analysisResult);
        freeTimeSlotRepository.saveAll(slots);

        return new FreeTimeSlotDto.WeeklyResponse(slots);
    }

    // ── 공강시간 조회 ─────────────────────────────────────────────

    @Transactional(readOnly = true)
    public FreeTimeSlotDto.WeeklyResponse getFreeSlots(Long userId) {
        userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        List<FreeTimeSlot> slots =
                freeTimeSlotRepository.findByUserUserIdOrderByDayOfWeekAscStartTimeAsc(userId);
        return new FreeTimeSlotDto.WeeklyResponse(slots);
    }

    // ── private helpers ──────────────────────────────────────────

    /**
     * FastAPI /analyze 엔드포인트에 이미지 전송.
     * 응답 형식:
     * {
     *   "MON": [{"startTime": "09:00", "endTime": "12:00"}, ...],
     *   ...
     * }
     */
    @SuppressWarnings("unchecked")
    private Map<String, List<Map<String, String>>> callAnalysisService(MultipartFile imageFile) {
        try {
            byte[] bytes = imageFile.getBytes();

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            ByteArrayResource resource = new ByteArrayResource(bytes) {
                @Override
                public String getFilename() {
                    return imageFile.getOriginalFilename() != null
                            ? imageFile.getOriginalFilename() : "timetable.jpg";
                }
            };
            body.add("file", resource);

            HttpEntity<MultiValueMap<String, Object>> request = new HttpEntity<>(body, headers);

            ResponseEntity<Map> response =
                    restTemplate.postForEntity(analysisUrl, request, Map.class);

            if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
                throw new CustomException(ErrorCode.TIMETABLE_ANALYSIS_FAILED);
            }

            return (Map<String, List<Map<String, String>>>) response.getBody();

        } catch (ResourceAccessException e) {
            log.error("FastAPI 연결 실패: {}", e.getMessage());
            throw new CustomException(ErrorCode.TIMETABLE_SERVICE_UNAVAILABLE);
        } catch (IOException e) {
            log.error("이미지 파일 읽기 실패: {}", e.getMessage());
            throw new CustomException(ErrorCode.TIMETABLE_ANALYSIS_FAILED);
        }
    }

    /**
     * FastAPI 분석 결과 Map → FreeTimeSlot 엔티티 리스트 변환
     */
    private List<FreeTimeSlot> buildSlots(
            User user,
            Map<String, List<Map<String, String>>> analysisResult) {

        List<FreeTimeSlot> result = new ArrayList<>();

        for (Map.Entry<String, List<Map<String, String>>> entry : analysisResult.entrySet()) {
            FreeTimeSlot.Weekday weekday;
            try {
                weekday = FreeTimeSlot.Weekday.valueOf(entry.getKey());
            } catch (IllegalArgumentException e) {
                log.warn("알 수 없는 요일 값: {}", entry.getKey());
                continue;
            }

            for (Map<String, String> slot : entry.getValue()) {
                LocalTime start = LocalTime.parse(slot.get("startTime"), TIME_FMT);
                LocalTime end   = LocalTime.parse(slot.get("endTime"),   TIME_FMT);

                result.add(FreeTimeSlot.builder()
                        .user(user)
                        .dayOfWeek(weekday)
                        .startTime(start)
                        .endTime(end)
                        .build());
            }
        }

        return result;
    }
}
