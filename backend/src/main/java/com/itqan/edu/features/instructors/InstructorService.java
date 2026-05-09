package com.itqan.edu.features.instructors;

import com.itqan.edu.common.exception.BusinessException;
import com.itqan.edu.common.exception.ErrorCode;
import com.itqan.edu.features.audit.AuditLogService;
import com.itqan.edu.features.auth.AuthRepository;
import com.itqan.edu.features.auth.User;
import com.itqan.edu.features.instructors.dto.InstructorCreateRequest;
import com.itqan.edu.features.instructors.dto.InstructorResponse;
import com.itqan.edu.features.instructors.dto.InstructorUpdateRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class InstructorService {

    private final AuthRepository authRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditLogService auditLogService;

    public Page<InstructorResponse> getAllInstructors(Pageable pageable) {
        return authRepository.findByRole(User.Role.INSTRUCTOR, pageable)
                .map(this::toResponse);
    }

    @Transactional
    public InstructorResponse createInstructor(InstructorCreateRequest request, User currentUser) {
        ensureSuperAdmin(currentUser);

        String normalizedEmail = normalizeEmail(request.getEmail());
        if (authRepository.existsByEmail(normalizedEmail)) {
            throw new BusinessException(ErrorCode.EMAIL_ALREADY_EXISTS);
        }

        User instructor = User.builder()
                .email(normalizedEmail)
                .password(passwordEncoder.encode(request.getPassword()))
                .authProvider(User.AuthProvider.LOCAL)
                .firstName(request.getFirstName().trim())
                .lastName(request.getLastName().trim())
                .role(User.Role.INSTRUCTOR)
                .superAdmin(false)
                .enabled(!Boolean.FALSE.equals(request.getEnabled()))
                .build();

        instructor = authRepository.save(instructor);
        auditLogService.recordSuccess("INSTRUCTOR_CREATED", "USER", String.valueOf(instructor.getId()),
                Map.of("email", instructor.getEmail()));
        return toResponse(instructor);
    }

    @Transactional
    public InstructorResponse updateInstructor(Long instructorId, InstructorUpdateRequest request, User currentUser) {
        ensureSuperAdmin(currentUser);

        User instructor = authRepository.findByIdAndRole(instructorId, User.Role.INSTRUCTOR)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        String normalizedEmail = normalizeEmail(request.getEmail());
        if (!instructor.getEmail().equals(normalizedEmail) && authRepository.existsByEmail(normalizedEmail)) {
            throw new BusinessException(ErrorCode.EMAIL_ALREADY_EXISTS);
        }

        boolean nextEnabled = request.getEnabled() == null
                ? Boolean.TRUE.equals(instructor.getEnabled())
                : request.getEnabled();

        instructor.setEmail(normalizedEmail);
        instructor.setFirstName(request.getFirstName().trim());
        instructor.setLastName(request.getLastName().trim());
        instructor.setEnabled(nextEnabled);

        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            instructor.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        instructor = authRepository.save(instructor);
        auditLogService.recordSuccess("INSTRUCTOR_UPDATED", "USER", String.valueOf(instructor.getId()),
                Map.of("email", instructor.getEmail()));
        return toResponse(instructor);
    }

    @Transactional
    public InstructorResponse deactivateInstructor(Long instructorId, User currentUser) {
        ensureSuperAdmin(currentUser);

        User instructor = authRepository.findByIdAndRole(instructorId, User.Role.INSTRUCTOR)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        instructor.setEnabled(false);
        instructor = authRepository.save(instructor);
        auditLogService.recordSuccess("INSTRUCTOR_DEACTIVATED", "USER", String.valueOf(instructor.getId()),
                Map.of("email", instructor.getEmail()));
        return toResponse(instructor);
    }

    private void ensureSuperAdmin(User currentUser) {
        if (currentUser.getRole() != User.Role.ADMIN || !Boolean.TRUE.equals(currentUser.getSuperAdmin())) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase();
    }

    private InstructorResponse toResponse(User user) {
        return InstructorResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .enabled(user.getEnabled())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }
}
