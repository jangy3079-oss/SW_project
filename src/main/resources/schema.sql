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
    preferences   TEXT            NULL     COMMENT '사용자 취향/태그 JSON',

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
-- 2. 이메일 인증 (로그인 담당자용)
-- ──────────────────────────────────────────
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
