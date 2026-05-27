-- =====================================================
-- 동아대 데이팅 앱 DB 스키마
-- charset: utf8mb4 (이모지·한글 완전 지원)
-- =====================================================

CREATE DATABASE IF NOT EXISTS donga_dating
    DEFAULT CHARACTER SET utf8mb4
    DEFAULT COLLATE utf8mb4_unicode_ci;

USE donga_dating;

-- ──────────────────────────────────────────
-- 1. 사용자 (로그인/회원가입은 별도 담당자)
-- ──────────────────────────────────────────
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

    -- 랭크 관련
    rank_score    DECIMAL(3,2)    NOT NULL DEFAULT 0.00 COMMENT '평균 평가 점수 (0.00~5.00)',
    rank_tier     ENUM('BRONZE','SILVER','GOLD','PLATINUM','DIAMOND')
                                  NOT NULL DEFAULT 'BRONZE',
    eval_count    INT             NOT NULL DEFAULT 0 COMMENT '총 평가 받은 횟수',

    -- 상태
    email_verified BOOLEAN        NOT NULL DEFAULT FALSE,
    is_active      BOOLEAN        NOT NULL DEFAULT TRUE,

    created_at    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (user_id),
    UNIQUE KEY uq_email (email),
    UNIQUE KEY uq_student_id (student_id),
    INDEX idx_gender (gender),
    INDEX idx_rank_tier (rank_tier)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ──────────────────────────────────────────
-- 2. 이메일 인증 (로그인 담당자용) (사용 x
-- ──────────────────────────────────────────
/*
CREATE TABLE email_verifications (
    verification_id BIGINT       NOT NULL AUTO_INCREMENT,
    email           VARCHAR(100) NOT NULL,
    token           VARCHAR(100) NOT NULL COMMENT 'UUID 인증 토큰',
    is_verified     BOOLEAN      NOT NULL DEFAULT FALSE,
    expires_at      TIMESTAMP    NOT NULL,
    created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (verification_id),
    INDEX idx_token (token),
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
*/

-- ──────────────────────────────────────────
-- 2. 이메일 인증 토큰 (VerificationToken 엔티티 기반)
-- ──────────────────────────────────────────
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

-- ──────────────────────────────────────────
-- 3. 프로필 사진
-- ──────────────────────────────────────────
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

-- ──────────────────────────────────────────
-- 4. 매칭 대기열
--    · GENERAL : 일반 매칭
--    · RANK    : 랭크 매칭 (rank_tier가 같거나 인접한 상대와 매칭)
-- ──────────────────────────────────────────
CREATE TABLE match_queue (
    queue_id      BIGINT          NOT NULL AUTO_INCREMENT,
    user_id       BIGINT          NOT NULL,
    match_type    ENUM('GENERAL','RANK') NOT NULL,
    status        ENUM('WAITING','MATCHED','CANCELLED') NOT NULL DEFAULT 'WAITING',
    entered_at    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (queue_id),
    CONSTRAINT fk_queue_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    -- 동시에 같은 타입으로 중복 대기 방지
    UNIQUE KEY uq_user_type_waiting (user_id, match_type, status),
    INDEX idx_queue_status (match_type, status, entered_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ──────────────────────────────────────────
-- 5. 매칭 결과
--    · male_user_id / female_user_id 로 성별 구분 보장
--    · status: ACTIVE → 둘 다 평가 완료 시 EVALUATED, 기간 만료 시 EXPIRED
-- ──────────────────────────────────────────
CREATE TABLE matches (
    match_id        BIGINT    NOT NULL AUTO_INCREMENT,
    male_user_id    BIGINT    NOT NULL,
    female_user_id  BIGINT    NOT NULL,
    match_type      ENUM('GENERAL','RANK') NOT NULL,
    status          ENUM('ACTIVE','EVALUATED','EXPIRED') NOT NULL DEFAULT 'ACTIVE',
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

-- ──────────────────────────────────────────
-- 6. 상대 평가
--    · 매칭 1건당 evaluator → evaluated 방향으로 1건만 허용
--    · score 1~5점, 평균이 users.rank_score 에 반영됨
-- ──────────────────────────────────────────
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
    -- 동일 매칭에서 같은 방향 평가 중복 방지
    UNIQUE KEY uq_eval_per_match (match_id, evaluator_id),
    INDEX idx_evaluated (evaluated_id),
    CONSTRAINT chk_score CHECK (score BETWEEN 1 AND 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ──────────────────────────────────────────
-- 7. rank_score 자동 갱신 트리거
--    평가 INSERT 후 피평가자의 rank_score / eval_count / rank_tier 를 즉시 재계산
-- ──────────────────────────────────────────
DELIMITER $$

CREATE TRIGGER trg_update_rank_after_eval
AFTER INSERT ON evaluations
FOR EACH ROW
BEGIN
    DECLARE avg_score DECIMAL(3,2);
    DECLARE cnt       INT;

    SELECT AVG(score), COUNT(*)
      INTO avg_score, cnt
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

DELIMITER ;

-- ──────────────────────────────────────────
-- 8. matches 상태 자동 갱신 트리거
--    양쪽 평가가 모두 완료되면 EVALUATED 로 변경
-- ──────────────────────────────────────────
DELIMITER $$

CREATE TRIGGER trg_match_evaluated
AFTER INSERT ON evaluations
FOR EACH ROW
BEGIN
    DECLARE eval_cnt INT;

    SELECT COUNT(*) INTO eval_cnt
      FROM evaluations
     WHERE match_id = NEW.match_id;

    -- 매칭 1건에 평가 2건(양방향) 완료 시
    IF eval_cnt = 2 THEN
        UPDATE matches
           SET status = 'EVALUATED'
         WHERE match_id = NEW.match_id;
    END IF;
END$$

DELIMITER ;

-- =====================================================
-- 9. 매칭 사용자 간 1:1 채팅
--    · match_id 기준으로 채팅방 생성
--    · 매칭된 사용자만 채팅 가능
--    · 채팅방 상태 관리 (ACTIVE / CLOSED / BLOCKED)
-- =====================================================
    CREATE TABLE chat_rooms (
                                room_id       BIGINT NOT NULL AUTO_INCREMENT,
                                match_id      BIGINT NOT NULL,

                                status        ENUM('ACTIVE','CLOSED','BLOCKED')
                  NOT NULL DEFAULT 'ACTIVE',

                                created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

                                PRIMARY KEY (room_id),

                                CONSTRAINT fk_chat_match
                                    FOREIGN KEY (match_id)
                                        REFERENCES matches(match_id)
                                        ON DELETE CASCADE,

        -- 매칭 1건당 채팅방 1개만 생성
                                UNIQUE KEY uq_chat_match (match_id)

    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


    -- =====================================================
-- 10. 채팅 메시지
--     · 메시지 내용 저장
--     · 읽음 여부 관리
--     · 삭제 여부 관리 (내 화면에서만 삭제용)
-- =====================================================
    CREATE TABLE chat_messages (
                                   message_id     BIGINT NOT NULL AUTO_INCREMENT,

                                   room_id        BIGINT NOT NULL,
                                   sender_id      BIGINT NOT NULL,

                                   content        TEXT NOT NULL COMMENT '채팅 메시지 내용',

                                   is_read        BOOLEAN NOT NULL DEFAULT FALSE COMMENT '읽음 여부',
                                   is_deleted     BOOLEAN NOT NULL DEFAULT FALSE COMMENT '삭제 여부',

                                   created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

                                   PRIMARY KEY (message_id),

                                   CONSTRAINT fk_message_room
                                       FOREIGN KEY (room_id)
                                           REFERENCES chat_rooms(room_id)
                                           ON DELETE CASCADE,

                                   CONSTRAINT fk_message_sender
                                       FOREIGN KEY (sender_id)
                                           REFERENCES users(user_id)
                                           ON DELETE CASCADE,

                                   INDEX idx_room_created (room_id, created_at),
                                   INDEX idx_unread (room_id, is_read)

    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


    -- =====================================================
-- 11. 사용자 신고 기능
--     · 욕설 / 스팸 / 부적절한 사진 등 신고 가능
--     · 신고 기록 저장
-- =====================================================
    CREATE TABLE reports (
                             report_id       BIGINT NOT NULL AUTO_INCREMENT,

                             reporter_id     BIGINT NOT NULL COMMENT '신고한 사용자',
                             reported_id     BIGINT NOT NULL COMMENT '신고당한 사용자',

                             reason          VARCHAR(255) NOT NULL COMMENT '신고 사유',

                             created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

                             PRIMARY KEY (report_id),

                             CONSTRAINT fk_report_reporter
                                 FOREIGN KEY (reporter_id)
                                     REFERENCES users(user_id)
                                     ON DELETE CASCADE,

                             CONSTRAINT fk_report_reported
                                 FOREIGN KEY (reported_id)
                                     REFERENCES users(user_id)
                                     ON DELETE CASCADE,

                             INDEX idx_reported (reported_id)

    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


    -- =====================================================
-- 12. 사용자 차단 기능
--     · 특정 사용자 차단 가능
--     · 차단 시 채팅 및 상호작용 제한
-- =====================================================
    CREATE TABLE blocks (
                            block_id        BIGINT NOT NULL AUTO_INCREMENT,

                            blocker_id      BIGINT NOT NULL COMMENT '차단한 사용자',
                            blocked_id      BIGINT NOT NULL COMMENT '차단당한 사용자',

                            created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

                            PRIMARY KEY (block_id),

                            CONSTRAINT fk_block_blocker
                                FOREIGN KEY (blocker_id)
                                    REFERENCES users(user_id)
                                    ON DELETE CASCADE,

                            CONSTRAINT fk_block_blocked
                                FOREIGN KEY (blocked_id)
                                    REFERENCES users(user_id)
                                    ON DELETE CASCADE,

        -- 동일 사용자 중복 차단 방지
                            UNIQUE KEY uq_block_pair (blocker_id, blocked_id)

    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =====================================================
-- 13. 공강시간 (에브리타임 시간표 분석 결과)
--     · 사용자가 시간표 이미지를 업로드하면 FastAPI 분석 후 저장
--     · 업로드마다 기존 데이터 전체 교체 (upsert 불필요)
-- =====================================================
CREATE TABLE free_time_slots (
    slot_id      BIGINT    NOT NULL AUTO_INCREMENT,
    user_id      BIGINT    NOT NULL,
    day_of_week  ENUM('MON','TUE','WED','THU','FRI') NOT NULL COMMENT '요일',
    start_time   TIME      NOT NULL COMMENT '공강 시작 시각',
    end_time     TIME      NOT NULL COMMENT '공강 종료 시각',
    created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (slot_id),
    CONSTRAINT fk_slot_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_slot_user (user_id),
    INDEX idx_slot_day  (user_id, day_of_week)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;