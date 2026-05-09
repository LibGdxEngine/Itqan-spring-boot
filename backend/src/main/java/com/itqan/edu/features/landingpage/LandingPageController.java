package com.itqan.edu.features.landingpage;

import com.itqan.edu.common.security.CurrentUserService;
import com.itqan.edu.features.landingpage.dto.HeroVideoUploadResponse;
import com.itqan.edu.features.landingpage.dto.LandingPageResponse;
import com.itqan.edu.features.landingpage.dto.LandingPageUpdateRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequiredArgsConstructor
@Tag(name = "Landing Page", description = "Public landing page configuration")
public class LandingPageController {

    private final LandingPageService landingPageService;
    private final CurrentUserService currentUserService;

    @GetMapping("/api/landing-page")
    @Operation(summary = "Get landing page data (public)")
    public ResponseEntity<LandingPageResponse> getLandingPage() {
        return ResponseEntity.ok(landingPageService.getPublic());
    }

    @PatchMapping("/api/admin/landing-page")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update landing page configuration")
    public ResponseEntity<LandingPageResponse> update(@Valid @RequestBody LandingPageUpdateRequest request,
                                                      Authentication authentication) {
        return ResponseEntity.ok(landingPageService.update(request, currentUserService.getCurrentUser(authentication)));
    }

    @PostMapping("/api/admin/landing-page/hero-video")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Upload hero video to S3, returns its URL")
    public ResponseEntity<HeroVideoUploadResponse> uploadHeroVideo(@RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(landingPageService.uploadHeroVideo(file));
    }
}
