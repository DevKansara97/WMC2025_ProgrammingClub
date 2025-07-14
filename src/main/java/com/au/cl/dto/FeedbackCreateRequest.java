package com.au.cl.dto;

import com.au.cl.model.FeedbackCategory;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

/**
 * DTO for submitting new feedback from an Avenger.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class FeedbackCreateRequest {
    @NotNull(message = "Feedback category cannot be null.")
    private FeedbackCategory category;

    @NotBlank(message = "Subject cannot be blank.")
    @Size(max = 255, message = "Subject cannot exceed 255 characters.")
    private String subject;

    @NotBlank(message = "Feedback message cannot be blank.")
    private String feedbackText;

    private Boolean isAnonymous = false; // Default to false if not provided

    private Integer rating; // Optional: 1-5 star rating
}
