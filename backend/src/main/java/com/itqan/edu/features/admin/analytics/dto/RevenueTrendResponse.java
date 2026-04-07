package com.itqan.edu.features.admin.analytics.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RevenueTrendResponse {
    private String granularity;
    private List<DataPoint> dataPoints;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DataPoint {
        private LocalDate date;
        private Double amount;
        private String currency;
    }
}
