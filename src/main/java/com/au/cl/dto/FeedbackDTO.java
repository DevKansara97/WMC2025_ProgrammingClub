package com.au.cl.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO for displaying feedback details.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class FeedbackDTO {
    private Long id;
    private String avengerUsername;
    private String feedbackText;
    private LocalDateTime submittedAt;
    private Boolean isRead;
}
