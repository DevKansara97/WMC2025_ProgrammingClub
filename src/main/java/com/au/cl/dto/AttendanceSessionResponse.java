package com.au.cl.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO for the response when starting an attendance session.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AttendanceSessionResponse {
    private Long sessionId;
    private String attendanceCode;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String message;
}
