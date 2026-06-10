package com.donga.dating.domain.matching.scheduler;

import com.donga.dating.domain.matching.service.FreeTimeMatchingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class FreeTimeMatchingScheduler {

    private final FreeTimeMatchingService freeTimeMatchingService;

    /**
     * 매일 자정(00:00:00)에 다음날 공강 매칭 실행
     */
    @Scheduled(cron = "0 0 0 * * *")
    public void scheduleFreeTimeMatching() {
        log.info("[스케줄러] 공강 매칭 시작");
        try {
            freeTimeMatchingService.runDailyFreeTimeMatching();
        } catch (Exception e) {
            log.error("[스케줄러] 공강 매칭 중 오류 발생", e);
        }
        log.info("[스케줄러] 공강 매칭 완료");
    }
}
