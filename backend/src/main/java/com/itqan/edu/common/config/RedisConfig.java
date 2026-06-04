package com.itqan.edu.common.config;

import com.fasterxml.jackson.annotation.JsonAutoDetect;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.annotation.PropertyAccessor;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.jsontype.BasicPolymorphicTypeValidator;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import io.lettuce.core.ClientOptions;
import io.lettuce.core.protocol.ProtocolVersion;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.data.redis.LettuceClientConfigurationBuilderCustomizer;
import org.springframework.cache.Cache;
import org.springframework.cache.annotation.CachingConfigurer;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.interceptor.CacheErrorHandler;
import org.springframework.cache.interceptor.SimpleCacheErrorHandler;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.StringRedisSerializer;

import java.time.Duration;

@Configuration
@EnableCaching
public class RedisConfig implements CachingConfigurer {

    private static final Logger log = LoggerFactory.getLogger(RedisConfig.class);

    @Value("${spring.cache.redis.time-to-live:600000}")
    private long timeToLiveMs;

    /**
     * Pin Lettuce to RESP2. Lettuce 6.6 auto-negotiates RESP3 via HELLO, which can stall
     * command processing on an otherwise-healthy connection (commands time out while the
     * raw socket is established). RESP2 is the long-stable protocol and avoids that handshake.
     */
    @Bean
    public LettuceClientConfigurationBuilderCustomizer lettuceProtocolCustomizer() {
        return builder -> builder.clientOptions(ClientOptions.builder()
                .protocolVersion(ProtocolVersion.RESP2)
                .build());
    }

    /**
     * Never let a Redis failure surface as a 500. When the cache backend is unreachable or
     * slow, log it and fall through: @Cacheable executes the method (reads the DB) and
     * @CacheEvict failures are ignored. Keeps public endpoints correct even if Redis is down.
     */
    @Override
    public CacheErrorHandler errorHandler() {
        return new SimpleCacheErrorHandler() {
            @Override
            public void handleCacheGetError(RuntimeException ex, Cache cache, Object key) {
                log.warn("Redis cache GET failed (cache={}, key={}); falling back to source: {}",
                        cache.getName(), key, ex.getMessage());
            }

            @Override
            public void handleCachePutError(RuntimeException ex, Cache cache, Object key, Object value) {
                log.warn("Redis cache PUT failed (cache={}, key={}); ignoring: {}",
                        cache.getName(), key, ex.getMessage());
            }

            @Override
            public void handleCacheEvictError(RuntimeException ex, Cache cache, Object key) {
                log.warn("Redis cache EVICT failed (cache={}, key={}); ignoring: {}",
                        cache.getName(), key, ex.getMessage());
            }

            @Override
            public void handleCacheClearError(RuntimeException ex, Cache cache) {
                log.warn("Redis cache CLEAR failed (cache={}); ignoring: {}",
                        cache.getName(), ex.getMessage());
            }
        };
    }

    @Bean
    public RedisCacheConfiguration cacheConfiguration() {
        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());
        mapper.setVisibility(PropertyAccessor.ALL, JsonAutoDetect.Visibility.ANY);
        mapper.activateDefaultTyping(
                BasicPolymorphicTypeValidator.builder().allowIfBaseType(Object.class).build(),
                ObjectMapper.DefaultTyping.NON_FINAL,
                JsonTypeInfo.As.PROPERTY);

        GenericJackson2JsonRedisSerializer serializer = new GenericJackson2JsonRedisSerializer(mapper);

        return RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(Duration.ofMillis(timeToLiveMs))
                .disableCachingNullValues()
                .serializeKeysWith(RedisSerializationContext.SerializationPair.fromSerializer(new StringRedisSerializer()))
                .serializeValuesWith(RedisSerializationContext.SerializationPair.fromSerializer(serializer));
    }
}
