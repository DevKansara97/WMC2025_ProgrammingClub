package com.au.cl.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

/**
 * DTO for creating a new announcement.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AnnouncementCreateRequest {
    @NotBlank(message = "Title cannot be blank.")
    @Size(max = 255, message = "Title cannot exceed 255 characters.")
    private String title;

    @NotBlank(message = "Content cannot be blank.")
    private String content;
}
