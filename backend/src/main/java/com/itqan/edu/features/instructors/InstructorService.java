package com.itqan.edu.features.instructors;

import com.itqan.edu.common.exception.BusinessException;
import com.itqan.edu.common.exception.ErrorCode;
import com.itqan.edu.features.audit.AuditLogService;
import com.itqan.edu.features.auth.AuthRepository;
import com.itqan.edu.features.auth.User;
import com.itqan.edu.features.courses.PublicFileStorage;
import com.itqan.edu.features.courses.dto.ThumbnailUploadResponse;
import com.itqan.edu.features.instructors.dto.InstructorCreateRequest;
import com.itqan.edu.features.instructors.dto.InstructorResponse;
import com.itqan.edu.features.instructors.dto.InstructorUpdateRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class InstructorService {

    private static final long MAX_PHOTO_BYTES = 5L * 1024 * 1024;
    private static final Set<String> ALLOWED_PHOTO_TYPES =
            Set.of("image/jpeg", "image/jpg", "image/png", "image/webp");

    private final AuthRepository authRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditLogService auditLogService;
    private final PublicFileStorage publicFileStorage;

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
                .photoUrl(emptyToNull(request.getPhotoUrl()))
                .titleAr(emptyToNull(request.getTitleAr()))
                .titleEn(emptyToNull(request.getTitleEn()))
                .bioAr(emptyToNull(request.getBioAr()))
                .bioEn(emptyToNull(request.getBioEn()))
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
        instructor.setPhotoUrl(emptyToNull(request.getPhotoUrl()));
        instructor.setTitleAr(emptyToNull(request.getTitleAr()));
        instructor.setTitleEn(emptyToNull(request.getTitleEn()));
        instructor.setBioAr(emptyToNull(request.getBioAr()));
        instructor.setBioEn(emptyToNull(request.getBioEn()));

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

    public ThumbnailUploadResponse uploadPhoto(MultipartFile file) {
        return publicFileStorage.upload(file, "instructors/photos", ALLOWED_PHOTO_TYPES, MAX_PHOTO_BYTES, "Photo");
    }

    private static String emptyToNull(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
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
                .photoUrl(user.getPhotoUrl())
                .titleAr(user.getTitleAr())
                .titleEn(user.getTitleEn())
                .bioAr(user.getBioAr())
                .bioEn(user.getBioEn())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }
}
