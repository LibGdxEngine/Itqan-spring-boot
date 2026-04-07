package com.itqan.edu.features.admin.content.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ModuleReorderRequest {
    @NotEmpty(message = "Module IDs list cannot be empty")
    private List<Long> moduleIds;
}
