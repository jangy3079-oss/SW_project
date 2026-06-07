package com.donga.dating.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.StringRedisSerializer;
import org.springframework.integration.redis.util.RedisLockRegistry;
import org.springframework.integration.support.locks.LockRegistry;

/**
 * Redis 설정
 *
 * 용도:
 * 1. 분산 락 (좋아요 발송, 매칭 수락 시 동시성 제어)
 * 2. TTL 기반 채팅방 만료 관리
 * 3. 랭크 매칭 거절 블록리스트 (24시간)
 * 4. 사용자 세션 캐시 (점수/티어 갱신 후 즉시 업데이트)
 */
@Configuration
@RequiredArgsConstructor
public class RedisConfig {

    /**
     * RedisTemplate 빈 설정
     * - 직렬화: Jackson 기반 JSON
     * - 문자열 키/값 관리
     */
    @Bean
    public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory connectionFactory) {
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(connectionFactory);

        // 직렬화 설정
        StringRedisSerializer stringRedisSerializer = new StringRedisSerializer();
        GenericJackson2JsonRedisSerializer jacksonRedisSerializer = new GenericJackson2JsonRedisSerializer();

        // key: String
        template.setKeySerializer(stringRedisSerializer);
        template.setHashKeySerializer(stringRedisSerializer);

        // value: JSON
        template.setValueSerializer(jacksonRedisSerializer);
        template.setHashValueSerializer(jacksonRedisSerializer);

        template.afterPropertiesSet();
        return template;
    }

    /**
     * 분산 락 레지스트리 빈
     * - Spring Integration 의 Redis 기반 분산 락 사용
     * - 좋아요 발송, 매칭 수락 시 Race Condition 방지
     * - 기본 타임아웃: 3초
     */
    @Bean
    public LockRegistry lockRegistry(RedisConnectionFactory connectionFactory) {
        return new RedisLockRegistry(connectionFactory, "dating-lock", 3000);
    }
}

