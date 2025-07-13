package com.au.cl.repository;

import com.au.cl.model.AttendanceRecord;
import com.au.cl.model.AttendanceRecord.AttendanceRecordId; // Import the inner ID class
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AttendanceRecordRepository extends JpaRepository<AttendanceRecord, AttendanceRecordId> {
    // Find records for a specific session
    List<AttendanceRecord> findBySessionId(Long sessionId);

    // Find records for a specific user
    List<AttendanceRecord> findByUserId(Long userId);

    // Check if a user has already marked attendance for a session
    boolean existsBySessionIdAndUserId(Long sessionId, Long userId);
}
