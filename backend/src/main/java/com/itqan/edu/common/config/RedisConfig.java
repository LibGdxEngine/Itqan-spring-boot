package com.itqan.edu.common.config;

import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableCaching
public class RedisConfig {
    // Spring Boot auto-configures RedisConnectionFactory and RedisCacheManager from properties.
    // This class exists to enable @Cacheable annotations via @EnableCaching.
}
