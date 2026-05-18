package com.donga.dating.domain.chat.repository;

import com.donga.dating.domain.chat.entity.Report;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * 사용자 신고 데이터 조회 Repository
 */
public interface ReportRepository extends JpaRepository<Report, Long> {
}