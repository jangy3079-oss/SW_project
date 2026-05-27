-- Flyway migration: create likes table
-- This migration is idempotent (IF NOT EXISTS) to avoid failures if table already exists

CREATE TABLE IF NOT EXISTS likes (
    like_id        BIGINT       NOT NULL AUTO_INCREMENT,
    from_user_id   BIGINT       NOT NULL,
    to_user_id     BIGINT       NOT NULL,
    created_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (like_id),
    UNIQUE KEY uq_like (from_user_id, to_user_id),
    INDEX idx_like_from (from_user_id),
    INDEX idx_like_to   (to_user_id),
    CONSTRAINT fk_like_from FOREIGN KEY (from_user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_like_to   FOREIGN KEY (to_user_id)   REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
