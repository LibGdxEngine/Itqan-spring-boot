package com.itqan.edu.features.clips;

import com.itqan.edu.features.clips.dto.ClipResponse;
import com.itqan.edu.features.clips.dto.ClipUpdateRequest;
import jakarta.validation.Valid;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Tag(name = "Clips", description = "مقطتفات — public video and audio clips")
public class ClipController {

    private final ClipService clipService;

    @GetMapping("/clips")
    public ResponseEntity<Page<ClipResponse>> listClips(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String type,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(clipService.listClips(search, type, pageable));
    }

    @PostMapping("/admin/clips/bulk-upload")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<ClipResponse>> bulkUpload(
            @RequestParam("files") List<MultipartFile> files) {
        return ResponseEntity.status(HttpStatus.CREATED).body(clipService.bulkUpload(files));
    }

    @PatchMapping("/admin/clips/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ClipResponse> updateClip(
            @PathVariable Long id,
            @RequestBody @Valid ClipUpdateRequest req) {
        return ResponseEntity.ok(clipService.updateClip(id, req));
    }

    @DeleteMapping("/admin/clips/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteClip(@PathVariable Long id) {
        clipService.deleteClip(id);
        return ResponseEntity.noContent().build();
    }
}
