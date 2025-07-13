package com.au.cl.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO for displaying announcement details.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AnnouncementDTO {
    private Long id;
    private String title;
    private String content;
    private String postedByUsername;
    private LocalDateTime postedAt;
}
