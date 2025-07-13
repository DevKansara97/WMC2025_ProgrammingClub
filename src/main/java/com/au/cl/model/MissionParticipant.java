package com.au.cl.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.io.Serializable; // Required for composite primary key
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "mission_participants")
@IdClass(MissionParticipant.MissionParticipantId.class) // Specify composite primary key class
public class MissionParticipant {

    @Id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "mission_id", nullable = false)
    private Mission mission;

    @Id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "joined_at", nullable = false)
    private LocalDateTime joinedAt = LocalDateTime.now();

    // Composite Primary Key Class
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MissionParticipantId implements Serializable {
        private Long mission; // Corresponds to the 'id' of the Mission object
        private Long user;    // Corresponds to the 'id' of the User object
    }
}
