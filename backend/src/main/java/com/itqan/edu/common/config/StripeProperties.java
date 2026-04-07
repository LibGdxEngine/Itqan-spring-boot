package com.itqan.edu.common.config;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;
import org.springframework.validation.annotation.Validated;

@Data
@Component
@Validated
@ConfigurationProperties(prefix = "stripe")
public class StripeProperties {

    @NotBlank
    private String secretKey;

    @NotBlank
    private String webhookSecret;

    @NotBlank
    private String successUrl;

    @NotBlank
    private String cancelUrl;

    @NotBlank
    private String currency = "usd";
}
