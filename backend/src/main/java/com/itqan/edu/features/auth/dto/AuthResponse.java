package com.itqan.edu.features.auth.dto;

import com.itqan.edu.features.auth.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    private Long id;
    private String token;
    private String email;
    private String firstName;
    private String lastName;
    private User.Role role;
    private Boolean superAdmin;
}
