package com.donga.dating.config;

import com.donga.dating.domain.chat.service.ChatAndEvaluationService;
import com.donga.dating.domain.matching.service.GonggangMatchingService;
import com.donga.dating.domain.matching.service.RankMatchingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.batch.core.JobParametersBuilder;
import org.springframework.batch.core.launch.JobLauncher;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

/**
 * 스케줄러 설정
 *
 * 실행 주기:
 * 1. 자정(00:00): 공강 매칭 배치
 * 2. 매 1분: 랭크 매칭 점수 윈도우 확장 로직 (자동)
 * 3. 매 5분: 만료된 좋아요 및 채팅방 처리
 */
@Component
@EnableScheduling
@Slf4j
@RequiredArgsConstructor
public class MatchingScheduler {

    private final JobLauncher jobLauncher;
    private final org.springframework.batch.core.Job gonggangMatchingJob;
    private final GonggangMatchingService gonggangMatchingService;
    private final RankMatchingService rankMatchingService;
    private final ChatAndEvaluationService chatAndEvaluationService;

    /**
     * 매일 자정(00:00 및 00:01)에 공강 매칭 배치 실행
     *
     * 주의: 배치가 정말 자정에만 실행되도록 신경써야 함
     * - 배치 시간: 약 30초 ~ 5분 (사용자 수에 따라)
     * - 배치 중 일반 API는 별도 데이터소스 사용
     */
    @Scheduled(cron = "0 0 0 * * ?")  // 매일 00:00:00
    public void triggerGonggangMatchingBatch() {
        log.info("[스케줄러] 공강 매칭 배치 시작 (시각: {})", LocalDateTime.now());

        try {
            // Spring Batch Job 실행
            jobLauncher.run(
                    gonggangMatchingJob,
                    new JobParametersBuilder()
                            .addLong("timestamp", System.currentTimeMillis())
                            .toJobParameters()
            );

            log.info("[스케줄러] 공강 매칭 배치 완료");
        } catch (Exception e) {
            log.error("[스케줄러] 공강 매칭 배치 실패", e);
        }
    }

    /**
     * 매 5분마다 실행: 만료된 좋아요 자동 거절 처리
     *
     * 역할:
     * - 24시간이 지난 PENDING 좋아요 → EXPIRED 처리
     * - 랭크 매칭 60초 타임아웃 → AUTO_REJECTED 처리
     */
    @Scheduled(fixedDelay = 300000, initialDelay = 60000)  // 5분마다, 초기 1분 딜레이
    public void processExpiredLikes() {
        log.debug("[스케줄러] 만료된 좋아요 처리 시작");

        try {
            rankMatchingService.autoRejectExpiredAcceptances();
            log.debug("[스케줄러] 만료된 좋아요 처리 완료");
        } catch (Exception e) {
            log.error("[스케줄러] 만료된 좋아요 처리 실패", e);
        }
    }

    /**
     * 매 5분마다 실행: 만료된 채팅방 및 유령 매칭 처리
     *
     * 역할:
     * - Redis에서 자동 만료된 채팅방 DB 상태 업데이트
     * - 대화 없이 24시간이 경과한 매칭(유령 매칭) 자동 종료
     * - 평가 기간 만료된 매칭 처리
     */
    @Scheduled(fixedDelay = 300000, initialDelay = 120000)  // 5분마다, 초기 2분 딜레이
    public void processExpiredChatRooms() {
        log.debug("[스케줄러] 만료된 채팅방 처리 시작");

        try {
            chatAndEvaluationService.processExpiredChatRooms();
            log.debug("[스케줄러] 만료된 채팅방 처리 완료");
        } catch (Exception e) {
            log.error("[스케줄러] 만료된 채팅방 처리 실패", e);
        }
    }

    /**
     * 매 10분마다 실행: 배치 상태 체크 (선택적)
     *
     * 역할:
     * - 배치 Job 실행 여부 확인
     * - 이전 배치가 정상 완료되었는지 체크
     * - 장시간 실행 중인 배치 감시
     */
    @Scheduled(fixedDelay = 600000, initialDelay = 300000)  // 10분마다, 초기 5분 딜레이
    public void monitorBatchHealth() {
        log.debug("[스케줄러] 배치 상태 모니터링");
        // 필요시 배치 상태 조회 로직 추가
    }
}

