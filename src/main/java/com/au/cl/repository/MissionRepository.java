package com.au.cl.repository;

import com.au.cl.model.Mission;
import com.au.cl.model.Mission.MissionStatus; // Import the inner enum
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MissionRepository extends JpaRepository<Mission, Long> {
    // Find missions by status
    List<Mission> findByStatus(MissionStatus status);

    // Count missions by status (for dashboard stats)
    long countByStatus(MissionStatus status);
}
