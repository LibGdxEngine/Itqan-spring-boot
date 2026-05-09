package com.itqan.edu.features.specializations;

import com.itqan.edu.features.specializations.dto.SpecializationRequest;
import com.itqan.edu.features.specializations.dto.SpecializationResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@Tag(name = "Specializations", description = "Course specializations / categories")
public class SpecializationController {

    private final SpecializationService specializationService;

    @GetMapping("/api/specializations")
    @Operation(summary = "List active specializations")
    public ResponseEntity<List<SpecializationResponse>> listPublic() {
        return ResponseEntity.ok(specializationService.getActive());
    }

    @GetMapping("/api/admin/specializations")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "List all specializations (admin)")
    public ResponseEntity<List<SpecializationResponse>> listAll() {
        return ResponseEntity.ok(specializationService.getAll());
    }

    @PostMapping("/api/admin/specializations")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create specialization")
    public ResponseEntity<SpecializationResponse> create(@Valid @RequestBody SpecializationRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(specializationService.create(request));
    }

    @PutMapping("/api/admin/specializations/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update specialization")
    public ResponseEntity<SpecializationResponse> update(@PathVariable Long id,
                                                         @Valid @RequestBody SpecializationRequest request) {
        return ResponseEntity.ok(specializationService.update(id, request));
    }

    @DeleteMapping("/api/admin/specializations/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete specialization")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        specializationService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
