package com.itqan.edu.features.payments.easykash;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

/**
 * EasyKash Direct Pay. Checkout stays unavailable until both credentials from the seller's
 * Integration Settings page are set in the environment.
 */
@Data
@Component
@ConfigurationProperties(prefix = "easykash")
public class EasyKashProperties {

    private String baseUrl = "https://back.easykash.net";

    /** Sent as the authorization header of Pay and Inquiry requests. Server-side only. */
    private String apiKey;

    /** Verifies the signatureHash of callbacks. */
    private String hmacSecret;

    private String currency = "EGP";

    /** How long a Fawry/Aman voucher stays payable. EasyKash's own default is only 3 hours. */
    private int cashExpiryHours = 48;

    /** The site's public origin; the buyer is sent back here after paying. */
    private String publicUrl = "http://localhost:3000";

    public boolean isConfigured() {
        return StringUtils.hasText(apiKey) && StringUtils.hasText(hmacSecret);
    }

    public String publicOrigin() {
        return publicUrl.endsWith("/") ? publicUrl.substring(0, publicUrl.length() - 1) : publicUrl;
    }
}
