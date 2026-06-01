package com.donga.dating.domain.matching.service;

import com.donga.dating.domain.matching.entity.FreeTimeRequest;
import com.donga.dating.domain.matching.entity.Match;
import com.donga.dating.domain.matching.repository.FreeTimeRequestRepository;
import com.donga.dating.domain.matching.repository.MatchRepository;
import com.donga.dating.domain.timetable.entity.FreeTimeSlot;
import com.donga.dating.domain.timetable.repository.FreeTimeSlotRepository;
import com.donga.dating.domain.user.entity.User;
import com.donga.dating.global.exception.CustomException;
import com.donga.dating.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class FreeTimeMatchingService {

    private static final long MIN_OVERLAP_MINUTES = 60L;
    private static final int  MATCH_VALID_HOURS   = 48;

    private final FreeTimeSlotRepository     freeTimeSlotRepository;
    private final FreeTimeRequestRepository  requestRepository;
    private final MatchRepository            matchRepository;

    // ── 수락 / 거절 ──────────────────────────────────────────────

    @Transactional
    public void acceptRequest(Long userId, Long requestId) {
        FreeTimeRequest req = getAndValidatePendingRequest(userId, requestId);

        // 실제 매칭 생성 (ACTIVE)
        User male   = req.getMaleUser();
        User female = req.getFemaleUser();
        Match match = matchRepository.save(Match.builder()
                .maleUser(male)
                .femaleUser(female)
                .matchType(Match.MatchType.GENERAL)
                .expiresAt(LocalDateTime.now().plusHours(MATCH_VALID_HOURS))
                .build());

        req.accept(match);
    }

    @Transactional
    public void rejectRequest(Long userId, Long requestId) {
        FreeTimeRequest req = getAndValidatePendingRequest(userId, requestId);
        req.reject();
    }

    /** 내 PENDING 공강 매칭 요청 목록 조회 */
    @Transactional(readOnly = true)
    public List<FreeTimeRequest> getPendingRequests(Long userId) {
        return requestRepository.findPendingByUserId(userId);
    }

    // ── 자정 배치: 다음날 공강 매칭 요청 생성 ───────────────────

    /**
     * 매일 자정 호출. 내일 요일을 기준으로:
     * 1. 해당 요일에 공강이 있는 남/녀 슬롯을 각각 조회
     * 2. 모든 남녀 조합에서 1시간 이상 겹치는 쌍 탐색
     * 3. 중복이 없는 쌍에 한해 FreeTimeRequest(PENDING) 생성
     */
    @Transactional
    public void runDailyFreeTimeMatching() {
        LocalDate tomorrow = LocalDate.now().plusDays(1);
        FreeTimeSlot.Weekday weekday = toWeekday(tomorrow.getDayOfWeek());
        if (weekday == null) {
            log.info("내일({})은 주말 — 공강 매칭 스킵", tomorrow);
            return;
        }

        List<FreeTimeSlot> allSlots = freeTimeSlotRepository.findByDayOfWeek(weekday);

        // 성별별 그룹핑: userId → List<FreeTimeSlot>
        Map<Long, List<FreeTimeSlot>> maleSlots  = new HashMap<>();
        Map<Long, List<FreeTimeSlot>> femaleSlots = new HashMap<>();

        for (FreeTimeSlot slot : allSlots) {
            User user = slot.getUser();
            if (user.getGender() == User.Gender.MALE) {
                maleSlots.computeIfAbsent(user.getUserId(), k -> new ArrayList<>()).add(slot);
            } else {
                femaleSlots.computeIfAbsent(user.getUserId(), k -> new ArrayList<>()).add(slot);
            }
        }

        int created = 0;
        for (Map.Entry<Long, List<FreeTimeSlot>> maleEntry : maleSlots.entrySet()) {
            Long maleId   = maleEntry.getKey();
            User maleUser = maleEntry.getValue().get(0).getUser();

            for (Map.Entry<Long, List<FreeTimeSlot>> femaleEntry : femaleSlots.entrySet()) {
                Long femaleId   = femaleEntry.getKey();
                User femaleUser = femaleEntry.getValue().get(0).getUser();

                // 같은 날짜 중복 요청 방지
                if (requestRepository.existsByMaleUserUserIdAndFemaleUserUserIdAndMatchedDate(
                        maleId, femaleId, tomorrow)) {
                    continue;
                }

                // 겹치는 구간 계산
                LocalTime[] overlap = findOverlap(maleEntry.getValue(), femaleEntry.getValue());
                if (overlap == null) continue;

                requestRepository.save(FreeTimeRequest.builder()
                        .maleUser(maleUser)
                        .femaleUser(femaleUser)
                        .matchedDate(tomorrow)
                        .overlapStart(overlap[0])
                        .overlapEnd(overlap[1])
                        .expiresAt(tomorrow.atTime(23, 59, 59))
                        .build());
                created++;
            }
        }

        log.info("[공강 매칭] 날짜={} 요일={} 생성된 요청={}건", tomorrow, weekday, created);
    }

    // ── private helpers ──────────────────────────────────────────

    private FreeTimeRequest getAndValidatePendingRequest(Long userId, Long requestId) {
        FreeTimeRequest req = requestRepository.findById(requestId)
                .orElseThrow(() -> new CustomException(ErrorCode.MATCH_NOT_FOUND));

        boolean isParticipant = req.getMaleUser().getUserId().equals(userId)
                || req.getFemaleUser().getUserId().equals(userId);
        if (!isParticipant) {
            throw new CustomException(ErrorCode.MATCH_NOT_PARTICIPANT);
        }

        if (req.getStatus() != FreeTimeRequest.RequestStatus.PENDING) {
            throw new CustomException(ErrorCode.MATCH_NOT_PENDING);
        }

        return req;
    }

    private LocalTime[] findOverlap(List<FreeTimeSlot> maleSlots, List<FreeTimeSlot> femaleSlots) {
        LocalTime bestStart = null;
        LocalTime bestEnd   = null;
        long bestMinutes    = 0;

        for (FreeTimeSlot m : maleSlots) {
            for (FreeTimeSlot f : femaleSlots) {
                LocalTime start = laterOf(m.getStartTime(), f.getStartTime());
                LocalTime end   = earlierOf(m.getEndTime(),   f.getEndTime());
                if (!start.isBefore(end)) continue;

                long minutes = ChronoUnit.MINUTES.between(start, end);
                if (minutes >= MIN_OVERLAP_MINUTES && minutes > bestMinutes) {
                    bestMinutes = minutes;
                    bestStart   = start;
                    bestEnd     = end;
                }
            }
        }

        return bestStart != null ? new LocalTime[]{bestStart, bestEnd} : null;
    }

    private LocalTime laterOf(LocalTime a, LocalTime b)  { return a.isAfter(b)  ? a : b; }
    private LocalTime earlierOf(LocalTime a, LocalTime b) { return a.isBefore(b) ? a : b; }

    private FreeTimeSlot.Weekday toWeekday(DayOfWeek dow) {
        return switch (dow) {
            case MONDAY    -> FreeTimeSlot.Weekday.MON;
            case TUESDAY   -> FreeTimeSlot.Weekday.TUE;
            case WEDNESDAY -> FreeTimeSlot.Weekday.WED;
            case THURSDAY  -> FreeTimeSlot.Weekday.THU;
            case FRIDAY    -> FreeTimeSlot.Weekday.FRI;
            default        -> null;
        };
    }
}
