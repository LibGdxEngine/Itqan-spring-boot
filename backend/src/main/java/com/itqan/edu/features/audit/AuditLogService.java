package com.itqan.edu.features.audit;

import com.itqan.edu.features.audit.AuditLog.AuditStatus;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;
    private final ObjectProvider<HttpServletRequest> requestProvider;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void record(String action, String resourceType, String resourceId,
                       Map<String, Object> metadata, AuditStatus status) {
        try {
            String actorEmail = null;
            Long actorUserId = null;

            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
                actorEmail = auth.getName();
            }

            String ipAddress = null;
            String userAgent = null;

            HttpServletRequest request = requestProvider.getIfAvailable();
            if (request != null) {
                ipAddress = resolveIpAddress(request);
                String ua = request.getHeader("User-Agent");
                if (ua != null) {
                    userAgent = ua.length() > 512 ? ua.substring(0, 512) : ua;
                }
            }

            AuditLog entry = AuditLog.builder()
                    .actorUserId(actorUserId)
                    .actorEmail(actorEmail)
                    .action(action)
                    .resourceType(resourceType)
                    .resourceId(resourceId)
                    .ipAddress(ipAddress)
                    .userAgent(userAgent)
                    .metadata(metadata)
                    .status(status)
                    .build();

            auditLogRepository.save(entry);

        } catch (Exception e) {
            log.error("Failed to write audit log for action={} resource={}/{}: {}",
                    action, resourceType, resourceId, e.getMessage(), e);
        }
    }

    public void recordSuccess(String action, String resourceType, String resourceId) {
        record(action, resourceType, resourceId, null, AuditStatus.SUCCESS);
    }

    public void recordSuccess(String action, String resourceType, String resourceId, Map<String, Object> metadata) {
        record(action, resourceType, resourceId, metadata, AuditStatus.SUCCESS);
    }

    public void recordFailure(String action, String resourceType, String resourceId, String reason) {
        Map<String, Object> metadata = reason != null ? Map.of("reason", reason) : null;
        record(action, resourceType, resourceId, metadata, AuditStatus.FAILURE);
    }

    private String resolveIpAddress(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
