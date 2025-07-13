package com.au.cl.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

/**
 * DTO to hold aggregated statistics for the admin dashboard overview.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStatsDTO {
    private long totalAvengers;
    private long activeMissions;
    private long pendingFeedback;
    private double totalPaymentsThisMonth;
}
