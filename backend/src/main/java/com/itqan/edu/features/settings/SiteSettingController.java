package com.itqan.edu.features.settings;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.concurrent.TimeUnit;

@RestController
@RequiredArgsConstructor
@Tag(name = "Site Settings", description = "Public site settings and their admin editor")
public class SiteSettingController {

    private final SiteSettingService siteSettingService;

    @GetMapping("/api/settings")
    @Operation(summary = "Public site settings (contact details, social links, payment toggles)")
    public ResponseEntity<Map<String, String>> getPublic() {
        return ResponseEntity.ok()
                .cacheControl(CacheControl.maxAge(60, TimeUnit.SECONDS).cachePublic())
                .body(siteSettingService.getAll());
    }

    @PutMapping("/api/admin/settings")
    @PreAuthorize("hasRole('ADMIN')")
    @SecurityRequirement(name = "Bearer Authentication")
    @Operation(summary = "Update site settings", description = "Partial update: send only the keys to change")
    public ResponseEntity<Map<String, String>> update(@RequestBody Map<String, String> changes) {
        return ResponseEntity.ok(siteSettingService.update(changes));
    }
}
