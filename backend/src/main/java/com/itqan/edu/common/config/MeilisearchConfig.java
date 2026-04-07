package com.itqan.edu.common.config;

import com.meilisearch.sdk.Client;
import com.meilisearch.sdk.Config;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class MeilisearchConfig {

    @Value("${meili.host}")
    private String host;

    @Value("${meili.master-key}")
    private String masterKey;

    @Bean
    public Client meilisearchClient() {
        return new Client(new Config(host, masterKey));
    }
}
