package com.au.cl.repository;

import com.au.cl.model.Mission;
import com.au.cl.model.Mission.MissionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MissionRepository extends JpaRepository<Mission, Long> {
    // Find missions by status
    List<Mission> findByStatus(MissionStatus status);

    // Count missions by status (for dashboard stats)
    long countByStatus(MissionStatus status);

    // Find missions a specific user is participating in
    // This requires a join through MissionParticipant
    @Query("SELECT m FROM Mission m JOIN m.participants mp WHERE mp.user.id = :userId ORDER BY m.createdAt DESC")
    List<Mission> findMissionsByParticipantId(Long userId);

    // Count active missions for a specific user
    @Query("SELECT COUNT(m) FROM Mission m JOIN m.participants mp WHERE mp.user.id = :userId AND m.status = 'ONGOING'")
    long countActiveMissionsByParticipantId(Long userId);

    // Count completed missions for a specific user
    @Query("SELECT COUNT(m) FROM Mission m JOIN m.participants mp WHERE mp.user.id = :userId AND m.status = 'COMPLETED'")
    long countCompletedMissionsByParticipantId(Long userId);
}
