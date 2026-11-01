package com.itqan.edu.features.scholarships.dto;

import com.itqan.edu.features.scholarships.FundingSource;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ScholarshipDecisionRequest {
    /** Required when approving. Ignored when rejecting. */
    private FundingSource fundingSource;

    /** Shown to the student in their request list and in the decision email. */
    @Size(max = 1000)
    private String note;
}
