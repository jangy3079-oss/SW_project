package com.donga.dating.domain.matching.repository;

import com.donga.dating.domain.matching.entity.FreeTimeRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDate;
import java.util.List;

public interface FreeTimeRequestRepository extends JpaRepository<FreeTimeRequest, Long> {

    /** 특정 유저의 PENDING 요청 목록 */
    @Query("SELECT r FROM FreeTimeRequest r JOIN FETCH r.maleUser JOIN FETCH r.femaleUser " +
           "WHERE (r.maleUser.userId = :userId OR r.femaleUser.userId = :userId) " +
           "AND r.status = 'PENDING'")
    List<FreeTimeRequest> findPendingByUserId(Long userId);

    /** 같은 날짜에 해당 남녀 쌍이 이미 요청이 있는지 확인 (중복 방지) */
    boolean existsByMaleUserUserIdAndFemaleUserUserIdAndMatchedDate(
            Long maleUserId, Long femaleUserId, LocalDate matchedDate);
}
