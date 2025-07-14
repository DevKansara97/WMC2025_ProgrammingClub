package com.au.cl.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

/**
 * DTO to hold attendance statistics for an Avenger.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AttendanceStatsDTO {
    private long daysPresent;
    private long daysAbsent;
    private double attendanceRate; // Percentage
}
