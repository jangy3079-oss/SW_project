package com.donga.dating.domain.timetable.repository;

import com.donga.dating.domain.timetable.entity.FreeTimeSlot;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FreeTimeSlotRepository extends JpaRepository<FreeTimeSlot, Long> {

    List<FreeTimeSlot> findByUserUserIdOrderByDayOfWeekAscStartTimeAsc(Long userId);

    void deleteByUserUserId(Long userId);

    boolean existsByUserUserId(Long userId);

    /** 특정 요일의 공강시간이 있는 모든 유저 슬롯 조회 (스케줄러용) */
    List<FreeTimeSlot> findByDayOfWeek(FreeTimeSlot.Weekday dayOfWeek);
}
