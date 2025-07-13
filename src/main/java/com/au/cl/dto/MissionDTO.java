package com.au.cl.dto;

import com.au.cl.model.Mission.MissionStatus;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO for displaying mission details in the frontend.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MissionDTO {
    private Long id;
    private String missionName;
    private String description;
    private MissionStatus status;
    private String assignedByUsername;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<UserDTO> participants; // List of UserDTOs for participants
}
