package com.au.cl.dto;

import com.au.cl.model.Mission.MissionStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.util.List;

/**
 * DTO for creating a new mission.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MissionCreateRequest {
    @NotBlank(message = "Mission name cannot be blank.")
    @Size(max = 255, message = "Mission name cannot exceed 255 characters.")
    private String missionName;

    @NotBlank(message = "Description cannot be blank.")
    private String description;

    @NotNull(message = "Status cannot be null.")
    private MissionStatus status;

    @NotEmpty(message = "At least one participant is required.")
    private List<Long> participantUserIds; // List of User IDs for participants
}
