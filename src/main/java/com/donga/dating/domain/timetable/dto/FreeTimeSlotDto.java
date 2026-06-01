package com.donga.dating.domain.timetable.dto;

import com.donga.dating.domain.timetable.entity.FreeTimeSlot;
import lombok.Getter;

import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

public class FreeTimeSlotDto {

    private static final DateTimeFormatter TIME_FMT = DateTimeFormatter.ofPattern("HH:mm");

    // ── 단일 공강 슬롯 응답 ─────────────────────────
    @Getter
    public static class SlotResponse {
        private final String dayOfWeek;
        private final String startTime;
        private final String endTime;

        public SlotResponse(FreeTimeSlot slot) {
            this.dayOfWeek = slot.getDayOfWeek().name();
            this.startTime = slot.getStartTime().format(TIME_FMT);
            this.endTime   = slot.getEndTime().format(TIME_FMT);
        }
    }

    // ── 시간표 등록 여부 응답 ───────────────────────
    @Getter
    public static class StatusResponse {
        private final boolean registered;

        public StatusResponse(boolean registered) {
            this.registered = registered;
        }
    }

    // ── 요일별로 그룹핑한 공강 응답 ─────────────────
    @Getter
    public static class WeeklyResponse {
        private final Map<String, List<String>> freeSlots;

        /**
         * 형식 예시:
         * {
         *   "MON": ["09:00-12:00", "15:00-18:00"],
         *   "TUE": ["09:00-13:30"],
         *   ...
         * }
         */
        public WeeklyResponse(List<FreeTimeSlot> slots) {
            this.freeSlots = slots.stream()
                    .collect(Collectors.groupingBy(
                            s -> s.getDayOfWeek().name(),
                            Collectors.mapping(
                                    s -> s.getStartTime().format(TIME_FMT)
                                            + "-"
                                            + s.getEndTime().format(TIME_FMT),
                                    Collectors.toList()
                            )
                    ));
        }
    }
}
