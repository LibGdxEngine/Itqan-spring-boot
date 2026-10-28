package com.itqan.edu.features.courses.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/** Full curriculum layout: modules in display order, each with its lessons in display order. */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CurriculumOrderRequest {

    @NotNull
    @Valid
    private List<ModuleOrder> modules;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ModuleOrder {
        @NotNull
        private Long moduleId;

        private List<Long> lessonIds;

        public List<Long> lessonIdsOrEmpty() {
            return lessonIds == null ? List.of() : lessonIds;
        }
    }
}
