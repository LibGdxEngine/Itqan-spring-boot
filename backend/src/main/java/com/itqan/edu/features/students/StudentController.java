package com.itqan.edu.features.students;

import com.itqan.edu.features.students.dto.StudentRequest;
import com.itqan.edu.features.students.dto.StudentResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/students")
@RequiredArgsConstructor
@Tag(name = "Students", description = "Student management APIs")
@SecurityRequirement(name = "Bearer Authentication")
public class StudentController {

    private final StudentService studentService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('INSTRUCTOR')")
    @Operation(summary = "Create a new student", description = "Create a new student")
    public ResponseEntity<StudentResponse> createStudent(@Valid @RequestBody StudentRequest request) {
        StudentResponse response = studentService.createStudent(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get student by ID", description = "Get a student by its ID")
    public ResponseEntity<StudentResponse> getStudentById(@PathVariable Long id) {
        StudentResponse response = studentService.getStudentById(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('INSTRUCTOR')")
    @Operation(summary = "Get all students", description = "Get all students")
    public ResponseEntity<List<StudentResponse>> getAllStudents() {
        List<StudentResponse> students = studentService.getAllStudents();
        return ResponseEntity.ok(students);
    }

    @GetMapping("/profile")
    @Operation(summary = "Get current student profile", description = "Get profile of the currently logged in student")
    public ResponseEntity<StudentResponse> getProfile() {
        String email = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication()
                .getName();
        StudentResponse response = studentService.getStudentByEmail(email);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/active")
    @PreAuthorize("hasRole('ADMIN') or hasRole('INSTRUCTOR')")
    @Operation(summary = "Get active students", description = "Get all active students")
    public ResponseEntity<List<StudentResponse>> getActiveStudents() {
        List<StudentResponse> students = studentService.getActiveStudents();
        return ResponseEntity.ok(students);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update student", description = "Update an existing student")
    public ResponseEntity<StudentResponse> updateStudent(
            @PathVariable Long id,
            @Valid @RequestBody StudentRequest request) {
        StudentResponse response = studentService.updateStudent(id, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete student", description = "Delete a student")
    public ResponseEntity<Void> deleteStudent(@PathVariable Long id) {
        studentService.deleteStudent(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/deactivate")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Deactivate student", description = "Deactivate a student")
    public ResponseEntity<StudentResponse> deactivateStudent(@PathVariable Long id) {
        StudentResponse response = studentService.deactivateStudent(id);
        return ResponseEntity.ok(response);
    }
}
