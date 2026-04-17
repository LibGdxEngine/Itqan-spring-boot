package com.itqan.edu.common.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class SecurityHeadersFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {

        // Prevent clickjacking
        response.setHeader("X-Frame-Options", "DENY");

        // Prevent MIME type sniffing
        response.setHeader("X-Content-Type-Options", "nosniff");

        // XSS protection (legacy browsers)
        response.setHeader("X-XSS-Protection", "1; mode=block");

        // Enforce HTTPS
        response.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");

        // Control referrer information
        response.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

        // Permissions policy
        response.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

        // Content Security Policy
        response.setHeader("Content-Security-Policy",
                "default-src 'self'; " +
                "script-src 'self'; " +
                "style-src 'self' 'unsafe-inline'; " +
                "img-src 'self' data: https:; " +
                "font-src 'self'; " +
                "connect-src 'self'; " +
                "frame-ancestors 'none'");

        filterChain.doFilter(request, response);
    }

    @Override
    protected boolean shouldNotFilter(@NonNull HttpServletRequest request) {
        String path = request.getRequestURI();
        // Swagger UI needs relaxed CSP
        return path.startsWith("/swagger-ui") || path.startsWith("/v3/api-docs");
    }
}
