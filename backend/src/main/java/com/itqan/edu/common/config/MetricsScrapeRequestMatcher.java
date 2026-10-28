package com.itqan.edu.common.config;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.web.util.matcher.RequestMatcher;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Base64;

/**
 * Lets a Prometheus scraper read /actuator/prometheus with HTTP Basic credentials
 * "prometheus:${METRICS_SCRAPE_TOKEN}" instead of an admin JWT. With no token
 * configured nothing matches, so the endpoint stays admin-only.
 */
@Component
public class MetricsScrapeRequestMatcher implements RequestMatcher {

    static final String PATH = "/actuator/prometheus";
    static final String USERNAME = "prometheus";

    private final byte[] expected;

    public MetricsScrapeRequestMatcher(@Value("${app.metrics.scrape-token:}") String token) {
        this.expected = token == null || token.isBlank()
                ? null
                : ("Basic " + Base64.getEncoder().encodeToString(
                        (USERNAME + ":" + token).getBytes(StandardCharsets.UTF_8)))
                        .getBytes(StandardCharsets.UTF_8);
    }

    @Override
    public boolean matches(HttpServletRequest request) {
        if (expected == null || !PATH.equals(request.getRequestURI())) {
            return false;
        }
        String header = request.getHeader("Authorization");
        return header != null
                && MessageDigest.isEqual(expected, header.getBytes(StandardCharsets.UTF_8));
    }
}
