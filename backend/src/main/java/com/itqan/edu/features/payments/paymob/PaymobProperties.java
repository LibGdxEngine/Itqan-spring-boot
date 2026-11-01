package com.itqan.edu.features.payments.paymob;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;

/** Paymob (Egypt) online payments. Off until the account credentials are set in the environment. */
@Data
@Component
@ConfigurationProperties(prefix = "paymob")
public class PaymobProperties {

    private boolean enabled = false;

    private String baseUrl = "https://accept.paymob.com";

    /** Secret key from the Paymob dashboard (Settings → Account info). Used server-side only. */
    private String secretKey;

    /** Public key, used to open Paymob's hosted checkout page. */
    private String publicKey;

    /** Payment integration IDs offered at checkout (card, mobile wallet, ...). */
    private List<Integer> integrationIds = new ArrayList<>();

    /** HMAC secret used to verify transaction callbacks. */
    private String hmacSecret;

    private String currency = "EGP";

    /** The site's public origin, e.g. https://itqan.example; used for redirect and callback URLs. */
    private String publicUrl = "http://localhost:3000";

    public boolean isConfigured() {
        return enabled && StringUtils.hasText(secretKey) && StringUtils.hasText(publicKey)
                && StringUtils.hasText(hmacSecret) && !integrationIds.isEmpty();
    }

    public String publicOrigin() {
        return publicUrl.endsWith("/") ? publicUrl.substring(0, publicUrl.length() - 1) : publicUrl;
    }
}
