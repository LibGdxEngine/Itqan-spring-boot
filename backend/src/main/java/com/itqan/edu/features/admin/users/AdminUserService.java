package com.itqan.edu.features.admin.users;

import com.itqan.edu.common.exception.BusinessException;
import com.itqan.edu.common.exception.ErrorCode;
import com.itqan.edu.features.admin.users.dto.AdminUserRow;
import com.itqan.edu.features.audit.AuditLogService;
import com.itqan.edu.features.auth.AuthRepository;
import com.itqan.edu.features.auth.RefreshTokenService;
import com.itqan.edu.features.auth.User;
import com.itqan.edu.features.students.StudentRepository;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/** Cross-role user directory for admins: search, filter and suspend/reactivate any account. */
@Service
@RequiredArgsConstructor
public class AdminUserService {

    private final AuthRepository authRepository;
    private final StudentRepository studentRepository;
    private final RefreshTokenService refreshTokenService;
    private final AuditLogService auditLogService;

    @Transactional(readOnly = true)
    public Page<AdminUserRow> search(String query, User.Role role, Boolean enabled, Pageable pageable) {
        return authRepository.findAll(filter(query, role, enabled), pageable).map(AdminUserRow::from);
    }

    @Transactional(readOnly = true)
    public List<AdminUserRow> export(String query, User.Role role, Boolean enabled) {
        return authRepository.findAll(filter(query, role, enabled)).stream().map(AdminUserRow::from).toList();
    }

    /**
     * Suspends or reactivates an account. Suspension also ends all sessions.
     * Admin accounts can only be changed by a super admin, nobody can suspend themselves,
     * and the last active super admin can never be suspended.
     */
    @Transactional
    public AdminUserRow setEnabled(Long userId, boolean enabled, User currentUser) {
        User target = authRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        if (target.getId().equals(currentUser.getId())) {
            throw new BusinessException(ErrorCode.FORBIDDEN, "You cannot change the status of your own account");
        }
        if (target.getRole() == User.Role.ADMIN && !Boolean.TRUE.equals(currentUser.getSuperAdmin())) {
            throw new BusinessException(ErrorCode.FORBIDDEN, "Only a super admin can change admin accounts");
        }
        if (!enabled && Boolean.TRUE.equals(target.getSuperAdmin()) && target.isEnabled()
                && authRepository.countBySuperAdminTrueAndEnabledTrue() <= 1) {
            throw new BusinessException(ErrorCode.FORBIDDEN, "The last active super admin cannot be suspended");
        }

        target.setEnabled(enabled);
        authRepository.save(target);
        if (target.getRole() == User.Role.STUDENT) {
            studentRepository.findByEmail(target.getEmail()).ifPresent(student -> {
                student.setActive(enabled);
                studentRepository.save(student);
            });
        }
        if (!enabled) {
            refreshTokenService.revokeAllUserTokens(target.getId());
        }

        auditLogService.recordSuccess(enabled ? "USER_REACTIVATED" : "USER_SUSPENDED", "USER",
                String.valueOf(target.getId()), Map.of("email", target.getEmail(), "role", target.getRole().name()));
        return AdminUserRow.from(target);
    }

    private Specification<User> filter(String query, User.Role role, Boolean enabled) {
        return (root, cq, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (StringUtils.hasText(query)) {
                String like = "%" + query.trim().toLowerCase(Locale.ROOT) + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("email")), like),
                        cb.like(cb.lower(root.get("firstName")), like),
                        cb.like(cb.lower(root.get("lastName")), like)));
            }
            if (role != null) {
                predicates.add(cb.equal(root.get("role"), role));
            }
            if (enabled != null) {
                predicates.add(cb.equal(root.get("enabled"), enabled));
            }
            return cb.and(predicates.toArray(Predicate[]::new));
        };
    }
}
