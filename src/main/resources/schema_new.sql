-- =====================================================
-- 동아대 데이팅 앱 최종 통합 DB 스키마 (feature/chat & Spring Batch v5 완전 대응)
-- charset: utf8mb4 (이모지·한글 완전 지원)
-- =====================================================

CREATE DATABASE donga_dating
    DEFAULT CHARACTER SET utf8mb4
    DEFAULT COLLATE utf8mb4_unicode_ci;

USE donga_dating;

-- ──────────────────────────────────────────
-- [PART 1] 스프링 배치(Spring Batch v5.x) 메타데이터 테이블
-- ──────────────────────────────────────────

CREATE TABLE BATCH_JOB_INSTANCE  (
                                     JOB_INSTANCE_ID BIGINT  NOT NULL PRIMARY KEY ,
                                     VERSION BIGINT ,
                                     JOB_NAME VARCHAR(100) NOT NULL,
                                     JOB_KEY VARCHAR(32) NOT NULL,
                                     constraint JOB_INST_UN unique (JOB_NAME, JOB_KEY)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE BATCH_JOB_EXECUTION  (
                                      JOB_EXECUTION_ID BIGINT  NOT NULL PRIMARY KEY ,
                                      VERSION BIGINT ,
                                      JOB_INSTANCE_ID BIGINT NOT NULL,
                                      CREATE_TIME DATETIME(6) NOT NULL,
                                      START_TIME DATETIME(6) DEFAULT NULL,
                                      END_TIME DATETIME(6) DEFAULT NULL,
                                      STATUS VARCHAR(10) ,
                                      EXIT_CODE VARCHAR(2500) ,
                                      EXIT_MESSAGE VARCHAR(2500) ,
                                      LAST_UPDATED DATETIME(6),
                                      constraint JOB_INST_EXEC_FK foreign KEY (JOB_INSTANCE_ID) references BATCH_JOB_INSTANCE(JOB_INSTANCE_ID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE BATCH_JOB_EXECUTION_PARAMS  (
                                             JOB_EXECUTION_ID BIGINT NOT NULL ,
                                             PARAMETER_NAME VARCHAR(100) NOT NULL ,
                                             PARAMETER_TYPE VARCHAR(100) NOT NULL ,
                                             PARAMETER_VALUE VARCHAR(2500) ,
                                             IDENTIFYING CHAR(1) NOT NULL ,
                                             constraint JOB_EXEC_PARAMS_FK foreign KEY (JOB_EXECUTION_ID) references BATCH_JOB_EXECUTION(JOB_EXECUTION_ID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE BATCH_STEP_EXECUTION  (
                                       STEP_EXECUTION_ID BIGINT  NOT NULL PRIMARY KEY ,
                                       VERSION BIGINT NOT NULL,
                                       STEP_NAME VARCHAR(100) NOT NULL,
                                       JOB_EXECUTION_ID BIGINT NOT NULL,
                                       CREATE_TIME DATETIME(6) NOT NULL, -- 🔥 Spring Batch v5 필수 컬럼 보강
                                       START_TIME DATETIME(6) DEFAULT NULL,
                                       END_TIME DATETIME(6) DEFAULT NULL,
                                       STATUS VARCHAR(10) ,
                                       COMMIT_COUNT BIGINT ,
                                       READ_COUNT BIGINT ,
                                       FILTER_COUNT BIGINT ,
                                       WRITE_COUNT BIGINT ,
                                       READ_SKIP_COUNT BIGINT ,
                                       WRITE_SKIP_COUNT BIGINT ,
                                       PROCESS_SKIP_COUNT BIGINT ,
                                       ROLLBACK_COUNT BIGINT ,
                                       EXIT_CODE VARCHAR(2500) ,
                                       EXIT_MESSAGE VARCHAR(2500) ,
                                       LAST_UPDATED DATETIME(6),
                                       constraint JOB_EXEC_STEP_FK foreign KEY (JOB_EXECUTION_ID) references BATCH_JOB_EXECUTION(JOB_EXECUTION_ID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE BATCH_STEP_EXECUTION_CONTEXT  (
                                               STEP_EXECUTION_ID BIGINT NOT NULL PRIMARY KEY,
                                               SHORT_CONTEXT VARCHAR(2500) NOT NULL,
                                               SERIALIZED_CONTEXT TEXT ,
                                               constraint STEP_EXEC_CTX_FK foreign KEY (STEP_EXECUTION_ID) references BATCH_STEP_EXECUTION(STEP_EXECUTION_ID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE BATCH_JOB_EXECUTION_CONTEXT  (
                                              JOB_EXECUTION_ID BIGINT NOT NULL PRIMARY KEY,
                                              SHORT_CONTEXT VARCHAR(2500) NOT NULL,
                                              SERIALIZED_CONTEXT TEXT ,
                                              constraint JOB_EXEC_CTX_FK foreign KEY (JOB_EXECUTION_ID) references BATCH_JOB_EXECUTION(JOB_EXECUTION_ID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE BATCH_STEP_EXECUTION_SEQ (
                                          ID BIGINT NOT NULL,
                                          UNIQUE_KEY CHAR(1) NOT NULL,
                                          constraint UNIQUE_KEY_UN unique (UNIQUE_KEY)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO BATCH_STEP_EXECUTION_SEQ (ID, UNIQUE_KEY) select * from (select 0 as ID, '0' as UNIQUE_KEY) as tmp where not exists (select * from BATCH_STEP_EXECUTION_SEQ);

CREATE TABLE BATCH_JOB_EXECUTION_SEQ (
                                         ID BIGINT NOT NULL,
                                         UNIQUE_KEY CHAR(1) NOT NULL,
                                         constraint UNIQUE_KEY_UN unique (UNIQUE_KEY)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO BATCH_JOB_EXECUTION_SEQ (ID, UNIQUE_KEY) select * from (select 0 as ID, '0' as UNIQUE_KEY) as tmp where not exists (select * from BATCH_JOB_EXECUTION_SEQ);

CREATE TABLE BATCH_JOB_SEQ (
                               ID BIGINT NOT NULL,
                               UNIQUE_KEY CHAR(1) NOT NULL,
                               constraint UNIQUE_KEY_UN unique (UNIQUE_KEY)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO BATCH_JOB_SEQ (ID, UNIQUE_KEY) select * from (select 0 as ID, '0' as UNIQUE_KEY) as tmp where not exists (select * from BATCH_JOB_SEQ);


-- ──────────────────────────────────────────
-- [PART 2] 도메인 서비스 비즈니스 테이블
-- ──────────────────────────────────────────

-- 1. 사용자 테이블
CREATE TABLE users (
                       user_id       BIGINT          NOT NULL AUTO_INCREMENT,
                       email         VARCHAR(100)    NOT NULL COMMENT '동아대 이메일 (@donga.ac.kr)',
                       password      VARCHAR(255)    NOT NULL COMMENT 'BCrypt 해시',
                       name          VARCHAR(30)     NOT NULL,
                       gender        ENUM('MALE','FEMALE') NOT NULL,
                       birth_date    DATE            NOT NULL,
                       student_id    VARCHAR(20)     NOT NULL COMMENT '학번',
                       department    VARCHAR(50)     NOT NULL COMMENT '학과',
                       grade         TINYINT         NOT NULL COMMENT '학년 1-4',
                       bio           TEXT            NULL     COMMENT '자기소개',

                       rank_score    DECIMAL(3,2)    NOT NULL DEFAULT 0.00 COMMENT '평균 평가 점수 (0.00~5.00)',
                       rank_tier     ENUM('BRONZE','SILVER','GOLD','PLATINUM','DIAMOND') NOT NULL DEFAULT 'BRONZE',
                       eval_count    INT             NOT NULL DEFAULT 0 COMMENT '총 평가 받은 횟수',

                       email_verified BOOLEAN        NOT NULL DEFAULT FALSE,
                       is_active      BOOLEAN        NOT NULL DEFAULT TRUE,
                       version        BIGINT          NOT NULL DEFAULT 0 COMMENT 'JPA 낙관적 락 버전',
                       created_at    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
                       updated_at    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

                       PRIMARY KEY (user_id),
                       UNIQUE KEY uq_email (email),
                       UNIQUE KEY uq_student_id (student_id),
                       INDEX idx_gender (gender),
                       INDEX idx_rank_tier (rank_tier)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. 이메일 인증 토큰
CREATE TABLE verification_tokens (
                                     id BIGINT NOT NULL AUTO_INCREMENT,
                                     token VARCHAR(100) NOT NULL COMMENT 'UUID 인증 토큰',
                                     expiry_date TIMESTAMP NOT NULL,
                                     user_id BIGINT NOT NULL,
                                     PRIMARY KEY (id),
                                     CONSTRAINT fk_token_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
                                     UNIQUE KEY uq_user (user_id),
                                     INDEX idx_token (token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. 프로필 사진
CREATE TABLE user_photos (
                             photo_id      BIGINT          NOT NULL AUTO_INCREMENT,
                             user_id       BIGINT          NOT NULL,
                             file_name     VARCHAR(255)    NOT NULL COMMENT '서버 저장 파일명 (UUID 기반)',
                             file_path     VARCHAR(500)    NOT NULL COMMENT '서버 내 절대 경로',
                             original_name VARCHAR(255)    NOT NULL COMMENT '원본 파일명',
                             file_size     BIGINT          NOT NULL COMMENT '파일 크기 (bytes)',
                             is_primary    BOOLEAN         NOT NULL DEFAULT FALSE COMMENT '대표 사진 여부',
                             photo_order   TINYINT         NOT NULL DEFAULT 0 COMMENT '사진 노출 순서 (0=대표)',
                             created_at    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,

                             PRIMARY KEY (photo_id),
                             CONSTRAINT fk_photo_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
                             INDEX idx_photo_user (user_id),
                             INDEX idx_primary (user_id, is_primary)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. 매칭 대기열
CREATE TABLE match_queue (
                             queue_id      BIGINT          NOT NULL AUTO_INCREMENT,
                             user_id       BIGINT          NOT NULL,
                             match_type    ENUM('GENERAL','RANK','LECTURE') NOT NULL,
                             status        ENUM('WAITING','MATCHED','CANCELLED') NOT NULL DEFAULT 'WAITING',
                             lecture_day   ENUM('MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY') NULL COMMENT '공강 요일',
                             lecture_start_time TIME NULL COMMENT '공강 시작 시간',
                             lecture_end_time   TIME NULL COMMENT '공강 종료 시간',
                             entered_at    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
                             updated_at    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

                             PRIMARY KEY (queue_id),
                             CONSTRAINT fk_queue_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
                             UNIQUE KEY uq_user_type_waiting (user_id, match_type),
                             INDEX idx_queue_status (match_type, status, entered_at),
                             INDEX idx_lecture (lecture_day, lecture_start_time, lecture_end_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. 매칭 결과
CREATE TABLE matches (
                         match_id        BIGINT    NOT NULL AUTO_INCREMENT,
                         male_user_id    BIGINT    NOT NULL,
                         female_user_id  BIGINT    NOT NULL,
                         match_type      ENUM('GENERAL','RANK', 'LECTURE') NOT NULL,
                         status          ENUM('ACTIVE','EVALUATED','EXPIRED','CANCELED') NOT NULL DEFAULT 'ACTIVE',
                         version         BIGINT    NOT NULL DEFAULT 0 COMMENT 'JPA 낙관적 락 버전',
                         matched_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                         expires_at      TIMESTAMP NOT NULL COMMENT '매칭 평가 마감 시각',
                         updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

                         PRIMARY KEY (match_id),
                         CONSTRAINT fk_match_male   FOREIGN KEY (male_user_id)   REFERENCES users(user_id),
                         CONSTRAINT fk_match_female FOREIGN KEY (female_user_id) REFERENCES users(user_id),
                         INDEX idx_match_male   (male_user_id, status),
                         INDEX idx_match_female (female_user_id, status),
                         INDEX idx_match_status (status, expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. 상대 평가
CREATE TABLE evaluations (
                             evaluation_id   BIGINT    NOT NULL AUTO_INCREMENT,
                             match_id        BIGINT    NOT NULL,
                             evaluator_id    BIGINT    NOT NULL COMMENT '평가자',
                             evaluated_id    BIGINT    NOT NULL COMMENT '피평가자',
                             score           TINYINT   NOT NULL COMMENT '1~5점',
                             created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

                             PRIMARY KEY (evaluation_id),
                             CONSTRAINT fk_eval_match     FOREIGN KEY (match_id)     REFERENCES matches(match_id),
                             CONSTRAINT fk_eval_evaluator FOREIGN KEY (evaluator_id) REFERENCES users(user_id),
                             CONSTRAINT fk_eval_evaluated FOREIGN KEY (evaluated_id) REFERENCES users(user_id),
                             UNIQUE KEY uq_eval_per_match (match_id, evaluator_id),
                             INDEX idx_evaluated (evaluated_id),
                             CONSTRAINT chk_score CHECK (score BETWEEN 1 AND 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. 사용자 좋아요 테이블
CREATE TABLE likes (
                       like_id     BIGINT AUTO_INCREMENT PRIMARY KEY,
                       sender_id   BIGINT NOT NULL,
                       receiver_id BIGINT NOT NULL,
                       status      VARCHAR(50) NOT NULL DEFAULT 'PENDING',
                       version     BIGINT NOT NULL DEFAULT 0 COMMENT 'JPA 낙관적 락 버전',
                       created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                       expires_at  TIMESTAMP NOT NULL DEFAULT (CURRENT_TIMESTAMP + INTERVAL 24 HOUR) COMMENT '24시간 후 만료',

                       CONSTRAINT fk_like_sender FOREIGN KEY (sender_id) REFERENCES users(user_id) ON DELETE CASCADE,
                       CONSTRAINT fk_like_receiver FOREIGN KEY (receiver_id) REFERENCES users(user_id) ON DELETE CASCADE,
                       CONSTRAINT uq_sender_receiver UNIQUE (sender_id, receiver_id),
                       CONSTRAINT chk_status_new CHECK (status IN ('PENDING','ACCEPTED','REJECTED','EXPIRED','CANCELLED_BY_SENDER','AUTO_REJECTED'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_likes_sender ON likes(sender_id);
CREATE INDEX idx_likes_receiver ON likes(receiver_id);
CREATE INDEX idx_likes_status ON likes(status);
CREATE INDEX idx_likes_expires ON likes(status, expires_at);

-- 8. 1:1 채팅방 테이블
CREATE TABLE chat_rooms (
                            room_id       BIGINT NOT NULL AUTO_INCREMENT,
                            match_id      BIGINT NOT NULL,
                            status        ENUM('ACTIVE','CLOSED','BLOCKED') NOT NULL DEFAULT 'ACTIVE',
                            is_read_only  BOOLEAN NOT NULL DEFAULT FALSE COMMENT '48시간 만료 후 읽기 전용 전환 여부',
                            expires_at    TIMESTAMP NULL COMMENT '48시간 후 자동 종료 예정 시각',
                            has_message   BOOLEAN NOT NULL DEFAULT FALSE COMMENT '대화 발생 여부 (유령방 판단 스케줄러용)',
                            version       BIGINT NOT NULL DEFAULT 0 COMMENT 'JPA 낙관적 락 버전',
                            created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

                            PRIMARY KEY (room_id),
                            CONSTRAINT fk_chat_match FOREIGN KEY (match_id) REFERENCES matches(match_id) ON DELETE CASCADE,
                            UNIQUE KEY uq_chat_match (match_id),
                            INDEX idx_chat_expires (expires_at, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. 채팅 메시지
CREATE TABLE chat_messages (
                               message_id     BIGINT NOT NULL AUTO_INCREMENT,
                               room_id        BIGINT NOT NULL,
                               sender_id      BIGINT NOT NULL,
                               content        TEXT NOT NULL COMMENT '채팅 메시지 내용',
                               is_read        BOOLEAN NOT NULL DEFAULT FALSE COMMENT '읽음 여부',
                               is_deleted     BOOLEAN NOT NULL DEFAULT FALSE COMMENT '삭제 여부',
                               created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

                               PRIMARY KEY (message_id),
                               CONSTRAINT fk_message_room FOREIGN KEY (room_id) REFERENCES chat_rooms(room_id) ON DELETE CASCADE,
    -- 🛠️ KEY -> FOREIGN KEY 문법 오류 원천 정정 완료
                               CONSTRAINT fk_message_sender FOREIGN KEY (sender_id) REFERENCES users(user_id) ON DELETE CASCADE,
                               INDEX idx_room_created (room_id, created_at),
                               INDEX idx_unread (room_id, is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. 사용자 신고 기능
CREATE TABLE reports (
                         report_id       BIGINT NOT NULL AUTO_INCREMENT,
                         reporter_id     BIGINT NOT NULL COMMENT '신고한 사용자',
                         reported_id     BIGINT NOT NULL COMMENT '신고당한 사용자',
                         reason          VARCHAR(255) NOT NULL COMMENT '신고 사유',
                         created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

                         PRIMARY KEY (report_id),
                         CONSTRAINT fk_report_reporter FOREIGN KEY (reporter_id) REFERENCES users(user_id) ON DELETE CASCADE,
                         CONSTRAINT fk_report_reported FOREIGN KEY (reported_id) REFERENCES users(user_id) ON DELETE CASCADE,
                         INDEX idx_reported (reported_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. 사용자 차단 기능
CREATE TABLE blocks (
                        block_id        BIGINT NOT NULL AUTO_INCREMENT,
                        blocker_id      BIGINT NOT NULL COMMENT '차단한 사용자',
                        blocked_id      BIGINT NOT NULL COMMENT '차단당한 사용자',
                        created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

                        PRIMARY KEY (block_id),
                        CONSTRAINT fk_block_blocker FOREIGN KEY (blocker_id) REFERENCES users(user_id) ON DELETE CASCADE,
                        CONSTRAINT fk_block_blocked FOREIGN KEY (blocked_id) REFERENCES users(user_id) ON DELETE CASCADE,
                        UNIQUE KEY uq_block_pair (blocker_id, blocked_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. 매칭 노출 이력
CREATE TABLE match_exposure_history (
                                        exposure_id      BIGINT          NOT NULL AUTO_INCREMENT,
                                        source_user_id   BIGINT          NOT NULL COMMENT '매칭 요청 보낸 사용자 (A)',
                                        target_user_id   BIGINT          NOT NULL COMMENT '후보 대상 사용자 (B)',
                                        match_type       ENUM('GENERAL','RANK','LECTURE') NOT NULL,
                                        exposure_reason  ENUM('REJECTED','REROLL_PASS','EXPIRED') NOT NULL COMMENT '노출 제외 사유',
                                        version          BIGINT          NOT NULL DEFAULT 0 COMMENT 'JPA 낙관적 락 버전',
                                        exposed_at       TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
                                        expires_at       TIMESTAMP       NOT NULL COMMENT 'CURRENT_TIMESTAMP + 7일',

                                        PRIMARY KEY (exposure_id),
                                        CONSTRAINT fk_exposure_source FOREIGN KEY (source_user_id) REFERENCES users(user_id) ON DELETE CASCADE,
                                        CONSTRAINT fk_exposure_target FOREIGN KEY (target_user_id) REFERENCES users(user_id) ON DELETE CASCADE,
                                        UNIQUE KEY uq_exposure_pair (source_user_id, target_user_id, match_type),
                                        INDEX idx_exposure_expires (source_user_id, expires_at),
                                        INDEX idx_exposure_target (target_user_id, expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. 남성 사용자 리롤 횟수 관리
CREATE TABLE reroll_counters (
                                 counter_id       BIGINT          NOT NULL AUTO_INCREMENT,
                                 user_id          BIGINT          NOT NULL COMMENT '남성 사용자만',
                                 remaining_rerolls INT            NOT NULL DEFAULT 3,
                                 reset_date       DATE            NOT NULL COMMENT '초기화 날짜 (자정 배치 실행 시)',
                                 version          BIGINT          NOT NULL DEFAULT 0 COMMENT 'JPA 낙관적 락 버전',
                                 updated_at       TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

                                 PRIMARY KEY (counter_id),
                                 CONSTRAINT fk_reroll_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
                                 UNIQUE KEY uq_reroll_user (user_id),
                                 INDEX idx_reroll_reset (reset_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ──────────────────────────────────────────
-- 트리거 정의 (동일 구동 보장)
-- ──────────────────────────────────────────
DELIMITER $$

-- 14. rank_score 자동 갱신 트리거
CREATE TRIGGER trg_update_rank_after_eval
    AFTER INSERT ON evaluations
    FOR EACH ROW
BEGIN
    DECLARE avg_score DECIMAL(3,2);
    DECLARE cnt       INT;

    SELECT AVG(score), COUNT(*) INTO avg_score, cnt
    FROM evaluations
    WHERE evaluated_id = NEW.evaluated_id;

    UPDATE users
    SET rank_score = avg_score,
        eval_count = cnt,
        rank_tier  = CASE
                         WHEN avg_score >= 4.5 THEN 'DIAMOND'
                         WHEN avg_score >= 4.0 THEN 'PLATINUM'
                         WHEN avg_score >= 3.0 THEN 'GOLD'
                         WHEN avg_score >= 2.0 THEN 'SILVER'
                         ELSE                       'BRONZE'
            END
    WHERE user_id = NEW.evaluated_id;
    END$$

    -- 15. matches 상태 자동 갱신 트리거
    CREATE TRIGGER trg_match_evaluated
        AFTER INSERT ON evaluations
        FOR EACH ROW
    BEGIN
        DECLARE eval_cnt INT;

        SELECT COUNT(*) INTO eval_cnt
        FROM evaluations
        WHERE match_id = NEW.match_id;

        IF eval_cnt = 2 THEN
        UPDATE matches
        SET status = 'EVALUATED'
        WHERE match_id = NEW.match_id;
    END IF;
    END$$

    DELIMITER ;