package com.au.cl.repository;

import com.au.cl.model.AttendanceRecord;
import com.au.cl.model.AttendanceRecord.AttendanceRecordId;
import com.au.cl.model.User; // Import User
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate; // For date-based queries
import java.util.List;

@Repository
public interface AttendanceRecordRepository extends JpaRepository<AttendanceRecord, AttendanceRecordId> {
    // Find records for a specific session
    List<AttendanceRecord> findBySessionId(Long sessionId);

    // Find records for a specific user
    List<AttendanceRecord> findByUserOrderByMarkedAtDesc(User user); // Order by date for history

    // Check if a user has already marked attendance for a session
    boolean existsBySessionIdAndUserId(Long sessionId, Long userId);

    // Count attendance records for a user within a specific month
    long countByUserAndMarkedAtBetween(User user, LocalDate startOfMonth, LocalDate endOfMonth);
}
