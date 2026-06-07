package com.donga.dating.config;

import com.donga.dating.domain.matching.service.GonggangMatchingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.batch.core.*;
import org.springframework.batch.core.job.builder.JobBuilder;
import org.springframework.batch.core.launch.support.RunIdIncrementer;
import org.springframework.batch.core.repository.JobRepository;
import org.springframework.batch.core.step.builder.StepBuilder;
import org.springframework.batch.core.step.tasklet.Tasklet;
import org.springframework.batch.repeat.RepeatStatus;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.transaction.PlatformTransactionManager;

/**
 * Spring Batch 설정
 *
 * 자정 공강 매칭 배치 작업:
 * 1. 리롤 카운터 초기화
 * 2. 만료된 노출 이력 정리
 * 3. 공강 기반 매칭 수행
 */
@Configuration
@Slf4j
@RequiredArgsConstructor
public class GonggangMatchingBatchConfig {

    private final GonggangMatchingService gonggangMatchingService;
    private final JobRepository jobRepository;
    private final PlatformTransactionManager transactionManager;

    /**
     * 배치 작업: Gonggang Matching
     */
    @Bean
    public Job gonggangMatchingJob(Step gonggangMatchingStep) {
        return new JobBuilder("gonggangMatchingJob", jobRepository)
                .incrementer(new RunIdIncrementer())
                .start(gonggangMatchingStep)
                .build();
    }

    /**
     * Step 1: Gonggang Matching 실행
     */
    @Bean
    public Step gonggangMatchingStep(Tasklet gonggangMatchingTasklet) {
        return new StepBuilder("gonggangMatchingStep", jobRepository)
                .tasklet(gonggangMatchingTasklet, transactionManager)
                .build();
    }

    /**
     * Tasklet: 공강 매칭 배치 로직
     */
    @Bean
    public Tasklet gonggangMatchingTasklet() {
        return (contribution, chunkContext) -> {
            try {
                log.info("[배치 시작] Gonggang Matching Batch Job");

                // 1. 리롤 카운터 초기화
                gonggangMatchingService.initializeRerollCountersForToday();

                // 2. 만료된 노출 이력 정리
                gonggangMatchingService.cleanupExpiredExposures();

                // 3. 공강 배치 실행
                gonggangMatchingService.executeGonggangMatchingBatch();

                log.info("[배치 완료] Gonggang Matching Batch Job");
                return RepeatStatus.FINISHED;

            } catch (Exception e) {
                log.error("[배치 실패] Gonggang Matching Batch Job", e);
                return RepeatStatus.FINISHED;
            }
        };
    }

    /**
     * 리스너: 배치 시작/완료 로그
     */
    @Bean
    public JobExecutionListener gonggangJobExecutionListener() {
        return new JobExecutionListener() {
            @Override
            public void beforeJob(JobExecution jobExecution) {
                log.info("[배치 시작] Job: {}, 시간: {}",
                        jobExecution.getJobInstance().getJobName(),
                        jobExecution.getStartTime());
            }

            @Override
            public void afterJob(JobExecution jobExecution) {
                BatchStatus status = jobExecution.getStatus();
                log.info("[배치 종료] Job: {}, 상태: {}, 시간: {}",
                        jobExecution.getJobInstance().getJobName(),
                        status,
                        jobExecution.getEndTime());

                if (status == BatchStatus.FAILED) {
                    jobExecution.getAllFailureExceptions().forEach(e ->
                            log.error("[배치 에러] ", e)
                    );
                }
            }
        };
    }
}

