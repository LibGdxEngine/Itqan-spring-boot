package com.itqan.edu.common.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Data
@ConfigurationProperties(prefix = "app.storage.s3")
public class StorageProperties {
    private String endpoint;
    private String region;
    private String accessKey;
    private String secretKey;
    private String bucket;
    private boolean pathStyleAccessEnabled = true;
}
