package com.donga.dating.domain.timetable.repository;

import com.donga.dating.domain.timetable.entity.FreeTimeSlot;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FreeTimeSlotRepository extends JpaRepository<FreeTimeSlot, Long> {

    List<FreeTimeSlot> findByUserUserIdOrderByDayOfWeekAscStartTimeAsc(Long userId);

    void deleteByUserUserId(Long userId);
}
