package com.au.cl.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO for displaying attendance record details.
 * Removed 'id' as AttendanceRecord uses a composite primary key.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AttendanceRecordDTO {
    // private Long id; // Removed: AttendanceRecord uses a composite key
    private Long sessionId;
    private String sessionCode; // To display the code
    private String avengerUsername;
    private LocalDateTime markedAt;
}
