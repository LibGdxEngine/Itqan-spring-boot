package com.itqan.edu.common.config;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.model.HeadBucketRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;

import java.net.URI;

@Configuration
@EnableConfigurationProperties({ StorageProperties.class, VideoStorageProperties.class })
@RequiredArgsConstructor
@Slf4j
public class StorageConfig {

    private final StorageProperties storageProperties;

    @PostConstruct
    void logStorageEndpoints() {
        log.info("Storage configured: endpoint={} publicEndpoint={} bucket={} region={}",
                storageProperties.getEndpoint(),
                storageProperties.getPublicEndpoint(),
                storageProperties.getBucket(),
                storageProperties.getRegion());
    }

    @Bean
    public S3Client s3Client(StorageProperties properties) {
        S3Client client = S3Client.builder()
                .endpointOverride(URI.create(properties.getEndpoint()))
                .region(Region.of(properties.getRegion()))
                .credentialsProvider(
                        StaticCredentialsProvider.create(
                                AwsBasicCredentials.create(properties.getAccessKey(), properties.getSecretKey())))
                .serviceConfiguration(
                        S3Configuration.builder()
                                .pathStyleAccessEnabled(properties.isPathStyleAccessEnabled())
                                .build())
                .build();
        try {
            client.headBucket(HeadBucketRequest.builder().bucket(properties.getBucket()).build());
            log.info("Storage bucket '{}' is reachable", properties.getBucket());
        } catch (Exception ex) {
            log.error("Storage bucket '{}' is NOT reachable at {}: {}",
                    properties.getBucket(), properties.getEndpoint(), ex.toString());
        }
        return client;
    }

    @Bean
    public S3Presigner s3Presigner(StorageProperties properties) {
        return S3Presigner.builder()
                .endpointOverride(URI.create(properties.getPublicEndpoint()))
                .region(Region.of(properties.getRegion()))
                .credentialsProvider(
                        StaticCredentialsProvider.create(
                                AwsBasicCredentials.create(properties.getAccessKey(), properties.getSecretKey())))
                .serviceConfiguration(
                        S3Configuration.builder()
                                .pathStyleAccessEnabled(properties.isPathStyleAccessEnabled())
                                .build())
                .build();
    }
}
