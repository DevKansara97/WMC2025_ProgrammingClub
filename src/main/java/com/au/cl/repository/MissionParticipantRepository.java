package com.au.cl.repository;

import com.au.cl.model.MissionParticipant;
import com.au.cl.model.MissionParticipant.MissionParticipantId; // Import the inner ID class
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MissionParticipantRepository extends JpaRepository<MissionParticipant, MissionParticipantId> {
    // Find participants for a specific mission
    List<MissionParticipant> findByMissionId(Long missionId);

    // Find missions a user is participating in
    List<MissionParticipant> findByUserId(Long userId);
}
