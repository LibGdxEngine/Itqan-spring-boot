package com.itqan.edu.features.certificates;

import com.itqan.edu.features.certificates.CertificateService.CertificateResponse;
import com.itqan.edu.features.certificates.CertificateService.Eligibility;
import com.itqan.edu.features.students.CurrentStudentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/certificates")
@RequiredArgsConstructor
@Tag(name = "Certificates", description = "Course completion certificates")
public class CertificateController {

    private final CertificateService certificateService;
    private final CurrentStudentService currentStudentService;

    @GetMapping("/me")
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(summary = "The caller's certificates")
    public List<CertificateResponse> mine(Authentication authentication) {
        return certificateService.mine(currentStudentService.require(authentication));
    }

    @GetMapping("/courses/{courseId}/eligibility")
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(summary = "What is left before the caller earns this course's certificate")
    public Eligibility eligibility(@PathVariable Long courseId, Authentication authentication) {
        return certificateService.eligibility(currentStudentService.require(authentication), courseId);
    }

    @PostMapping("/courses/{courseId}")
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(summary = "Issue (or return) the caller's certificate for a finished course")
    public CertificateResponse claim(@PathVariable Long courseId, Authentication authentication) {
        return certificateService.claim(currentStudentService.require(authentication), courseId);
    }

    @GetMapping("/verify/{code}")
    @Operation(summary = "Public verification of a certificate code")
    public CertificateResponse verify(@PathVariable String code) {
        return certificateService.verify(code);
    }
}
