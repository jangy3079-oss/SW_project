package com.donga.dating.domain.timetable.controller;

import com.donga.dating.domain.timetable.dto.FreeTimeSlotDto;
import com.donga.dating.domain.timetable.service.TimetableService;
import com.donga.dating.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

/**
 * [시간표 API]
 * POST /api/users/{userId}/timetable  - 에브리타임 시간표 이미지 업로드 → 공강시간 분석 & 저장
 * GET  /api/users/{userId}/timetable  - 저장된 공강시간 조회
 */
@RestController
@RequestMapping("/api/users/{userId}/timetable")
@RequiredArgsConstructor
public class TimetableController {

    private final TimetableService timetableService;

    /**
     * 에브리타임 시간표 이미지 업로드
     * - multipart/form-data 로 이미지 수신
     * - FastAPI 분석 후 공강시간 DB 저장
     * - 재업로드 시 기존 데이터 전체 교체
     */
    @PostMapping(consumes = "multipart/form-data")
    public ResponseEntity<ApiResponse<FreeTimeSlotDto.WeeklyResponse>> uploadTimetable(
            @PathVariable Long userId,
            @RequestParam("file") MultipartFile file) {

        FreeTimeSlotDto.WeeklyResponse result = timetableService.uploadTimetable(userId, file);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    /**
     * 저장된 공강시간 조회
     */
    @GetMapping
    public ResponseEntity<ApiResponse<FreeTimeSlotDto.WeeklyResponse>> getFreeSlots(
            @PathVariable Long userId) {

        FreeTimeSlotDto.WeeklyResponse result = timetableService.getFreeSlots(userId);
        return ResponseEntity.ok(ApiResponse.success(result));
    }
}
