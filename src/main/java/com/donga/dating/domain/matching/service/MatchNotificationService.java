package com.donga.dating.domain.matching.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * 매칭 이벤트 알림 (Redis 큐 기반, 클라이언트 폴링/구독용)
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class MatchNotificationService {

    public static final String TYPE_MATCH_CANCELLED = "MATCH_CANCELLED";

    private static final String NOTIFICATION_KEY_PREFIX = "match:notification:";

    private final RedisTemplate<String, Object> redisTemplate;

    public void notifyMatchCancelled(Long targetUserId, Long counterpartUserId, String reason) {
        Map<String, Object> notification = new LinkedHashMap<>();
        notification.put("type", TYPE_MATCH_CANCELLED);
        notification.put("counterpartUserId", counterpartUserId);
        notification.put("reason", reason);
        notification.put("timestamp", System.currentTimeMillis());

        String key = NOTIFICATION_KEY_PREFIX + targetUserId;
        redisTemplate.opsForList().leftPush(key, notification);
        redisTemplate.expire(key, Duration.ofHours(24));

        log.info("[매칭 취소 알림] userId={}, counterpartUserId={}, reason={}",
                targetUserId, counterpartUserId, reason);
    }
}
