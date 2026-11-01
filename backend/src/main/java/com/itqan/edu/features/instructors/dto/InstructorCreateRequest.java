package com.itqan.edu.features.instructors.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class InstructorCreateRequest {

    @NotBlank(message = "Email is required")
    @Email(message = "Email should be valid")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 8, message = "Password must be at least 8 characters")
    private String password;

    @NotBlank(message = "First name is required")
    @Size(min = 2, max = 50, message = "First name must be between 2 and 50 characters")
    private String firstName;

    @NotBlank(message = "Last name is required")
    @Size(min = 2, max = 50, message = "Last name must be between 2 and 50 characters")
    private String lastName;

    private Boolean enabled;

    @Size(max = 1000, message = "Photo URL is too long")
    private String photoUrl;

    @Size(max = 200, message = "Title must be at most 200 characters")
    private String titleAr;

    @Size(max = 200, message = "Title must be at most 200 characters")
    private String titleEn;

    @Size(max = 4000, message = "Bio must be at most 4000 characters")
    private String bioAr;

    @Size(max = 4000, message = "Bio must be at most 4000 characters")
    private String bioEn;
}
