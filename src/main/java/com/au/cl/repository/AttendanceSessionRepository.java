package com.au.cl.repository;

import com.au.cl.model.AttendanceSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AttendanceSessionRepository extends JpaRepository<AttendanceSession, Long> {
    // Find active sessions
    List<AttendanceSession> findByIsActiveTrue();

    // Find session by code and active status
    Optional<AttendanceSession> findByAttendanceCodeAndIsActiveTrue(String attendanceCode);
}
