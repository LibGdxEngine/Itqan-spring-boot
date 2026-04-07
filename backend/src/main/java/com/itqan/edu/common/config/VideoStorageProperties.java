package com.itqan.edu.common.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Data
@ConfigurationProperties(prefix = "app.video")
public class VideoStorageProperties {
    private long maxSizeBytes = 5L * 1024 * 1024 * 1024;
    private long multipartPartSizeBytes = 16L * 1024 * 1024;
    private long presignExpiryMinutes = 15;
    private long playbackUrlExpiryMinutes = 60;
}
