package com.itqan.edu.common.security;

import com.itqan.edu.common.exception.ErrorCode;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.MediaType;
import org.springframework.lang.NonNull;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Per-client-IP fixed-window rate limiting for brute-force sensitive auth endpoints
 * (login, registration, password-reset OTP). In-memory, so limits are per backend instance,
 * which matches the single-instance deployment in compose.yaml.
 */
@Slf4j
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 10)
public class RateLimitFilter extends OncePerRequestFilter {

    private record Rule(String name, List<String> paths, int maxRequests, Duration window) {
    }

    private record Window(long startMillis, int count) {
    }

    private final boolean enabled;
    private final List<Rule> rules;
    private final Map<String, Window> windows = new ConcurrentHashMap<>();

    public RateLimitFilter(
            @Value("${security.rate-limit.enabled:true}") boolean enabled,
            @Value("${security.rate-limit.auth-per-minute:10}") int authPerMinute,
            @Value("${security.rate-limit.otp-request-per-15min:5}") int otpRequestsPer15Min,
            @Value("${security.rate-limit.otp-verify-per-15min:10}") int otpVerifyPer15Min) {
        this.enabled = enabled;
        this.rules = List.of(
                new Rule("auth", List.of("/api/auth/login", "/api/auth/register", "/api/auth/google"),
                        authPerMinute, Duration.ofMinutes(1)),
                new Rule("otp-request", List.of("/api/auth/forgot-password"),
                        otpRequestsPer15Min, Duration.ofMinutes(15)),
                new Rule("otp-verify", List.of("/api/auth/verify-otp", "/api/auth/reset-password"),
                        otpVerifyPer15Min, Duration.ofMinutes(15)),
                // Public guest endpoint: each call creates a Stripe session and a pending row.
                new Rule("donation-checkout", List.of("/api/donations/checkout"),
                        10, Duration.ofMinutes(15)),
                new Rule("scholarship-apply", List.of("/api/scholarships/applications"),
                        10, Duration.ofHours(1)));
    }

    @Override
    protected boolean shouldNotFilter(@NonNull HttpServletRequest request) {
        return !enabled || !"POST".equalsIgnoreCase(request.getMethod()) || findRule(request.getRequestURI()) == null;
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {

        Rule rule = findRule(request.getRequestURI());
        String key = rule.name() + "|" + clientIp(request);
        long now = System.currentTimeMillis();
        long windowMillis = rule.window().toMillis();

        Window window = windows.compute(key, (k, current) ->
                current == null || now - current.startMillis() >= windowMillis
                        ? new Window(now, 1)
                        : new Window(current.startMillis(), current.count() + 1));

        if (window.count() > rule.maxRequests()) {
            long retryAfterSeconds = Math.max(1, (window.startMillis() + windowMillis - now) / 1000);
            log.warn("Rate limit '{}' exceeded for {}", rule.name(), clientIp(request));
            ErrorCode code = ErrorCode.TOO_MANY_REQUESTS;
            response.setStatus(code.getStatus());
            response.setHeader("Retry-After", String.valueOf(retryAfterSeconds));
            response.setContentType(MediaType.APPLICATION_PROBLEM_JSON_VALUE);
            response.getWriter().write(String.format(
                    "{\"type\":\"about:blank\",\"title\":\"Too Many Requests\",\"status\":%d," +
                            "\"detail\":\"%s\",\"code\":\"%s\"}",
                    code.getStatus(), code.getMessage(), code.getCode()));
            return;
        }

        filterChain.doFilter(request, response);
    }

    /** Drops expired windows so the map does not grow without bound. */
    @Scheduled(fixedDelay = 300_000)
    public void evictExpiredWindows() {
        long now = System.currentTimeMillis();
        long longestWindow = rules.stream().mapToLong(r -> r.window().toMillis()).max().orElse(0);
        windows.entrySet().removeIf(e -> now - e.getValue().startMillis() >= longestWindow);
    }

    private Rule findRule(String uri) {
        for (Rule rule : rules) {
            if (rule.paths().contains(uri)) {
                return rule;
            }
        }
        return null;
    }

    /**
     * Cloudflare sets CF-Connecting-IP and Caddy sets X-Real-IP; fall back to the socket address
     * when the backend is reached directly (local development).
     */
    private String clientIp(HttpServletRequest request) {
        String cfIp = request.getHeader("CF-Connecting-IP");
        if (StringUtils.hasText(cfIp)) {
            return cfIp.trim();
        }
        String realIp = request.getHeader("X-Real-IP");
        if (StringUtils.hasText(realIp)) {
            return realIp.trim();
        }
        return request.getRemoteAddr();
    }
}
