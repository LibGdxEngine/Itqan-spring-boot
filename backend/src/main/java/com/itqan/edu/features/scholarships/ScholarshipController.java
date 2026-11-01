package com.itqan.edu.features.scholarships;

import com.itqan.edu.common.security.CurrentUserService;
import com.itqan.edu.features.scholarships.dto.MyScholarshipApplication;
import com.itqan.edu.features.scholarships.dto.ScholarshipApplyRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/scholarships")
@PreAuthorize("hasRole('STUDENT')")
@RequiredArgsConstructor
@Tag(name = "Scholarships", description = "Students applying for a free course")
@SecurityRequirement(name = "Bearer Authentication")
public class ScholarshipController {

    private final ScholarshipService scholarshipService;
    private final CurrentUserService currentUserService;

    @PostMapping("/applications")
    @Operation(summary = "Apply for a scholarship for a course")
    public ResponseEntity<MyScholarshipApplication> apply(@Valid @RequestBody ScholarshipApplyRequest request,
                                                          Authentication authentication) {
        Long studentId = currentUserService.getCurrentStudentId(authentication);
        return ResponseEntity.status(HttpStatus.CREATED).body(scholarshipService.apply(request, studentId));
    }

    @GetMapping("/applications/me")
    @Operation(summary = "The current student's scholarship requests")
    public ResponseEntity<List<MyScholarshipApplication>> mine(Authentication authentication) {
        return ResponseEntity.ok(scholarshipService.listMine(currentUserService.getCurrentStudentId(authentication)));
    }

    @PostMapping("/applications/{id}/withdraw")
    @Operation(summary = "Withdraw a pending request")
    public ResponseEntity<MyScholarshipApplication> withdraw(@PathVariable Long id, Authentication authentication) {
        return ResponseEntity.ok(scholarshipService.withdraw(id, currentUserService.getCurrentStudentId(authentication)));
    }
}
