package com.au.cl.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.HashSet; // Use HashSet for performance
import java.util.Set; // Use Set to avoid duplicates

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "missions")
public class Mission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "mission_name", nullable = false)
    private String missionName;

    @Column(name = "description", columnDefinition = "TEXT", nullable = false)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private MissionStatus status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_by_user_id", nullable = false)
    private User assignedBy; // Admin who assigned the mission

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    // Define the relationship with MissionParticipant
    // This allows you to access participants directly from a Mission object
    // 'mappedBy' indicates that the 'mission' field in MissionParticipant is the owner of the relationship.
    // CascadeType.ALL: If a mission is deleted, its participants entries are also deleted.
    // orphanRemoval = true: Ensures that if a MissionParticipant is removed from this set, it's also removed from the database.
    @OneToMany(mappedBy = "mission", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private Set<MissionParticipant> participants = new HashSet<>(); // Initialize to prevent NullPointerException

    public enum MissionStatus {
        ONGOING,
        COMPLETED,
        FAILED,
        MARTYRED // For missions where Avengers are lost
    }

    // Helper methods to manage the bidirectional relationship
    public void addParticipant(MissionParticipant participant) {
        this.participants.add(participant);
        participant.setMission(this);
    }

    public void removeParticipant(MissionParticipant participant) {
        this.participants.remove(participant);
        participant.setMission(null);
    }
}
