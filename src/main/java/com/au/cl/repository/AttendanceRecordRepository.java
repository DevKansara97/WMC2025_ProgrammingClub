package com.au.cl.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.au.cl.model.AttendanceRecord;
import com.au.cl.model.AttendanceRecord.AttendanceRecordId; // <--- Changed import from LocalDate to LocalDateTime
import com.au.cl.model.User;

@Repository
public interface AttendanceRecordRepository extends JpaRepository<AttendanceRecord, AttendanceRecordId> {
    // Find records for a specific session
    List<AttendanceRecord> findBySessionId(Long sessionId);

    // Find records for a specific user
    List<AttendanceRecord> findByUserOrderByMarkedAtDesc(User user);

    // Check if a user has already marked attendance for a session
    boolean existsBySessionIdAndUserId(Long sessionId, Long userId);

    // Count attendance records for a user within a specific month
    // Changed parameter types from LocalDate to LocalDateTime
    long countByUserAndMarkedAtBetween(User user, LocalDateTime startDateTime, LocalDateTime endDateTime);
}