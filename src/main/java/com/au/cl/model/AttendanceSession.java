package com.au.cl.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "attendance_sessions")
public class AttendanceSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "admin_user_id", nullable = false)
    private User adminUser; // Admin who started the session

    @Column(name = "attendance_code", nullable = false, unique = true, length = 6)
    private String attendanceCode; // The 6-digit code

    @Column(name = "start_time", nullable = false)
    private LocalDateTime startTime = LocalDateTime.now();

    @Column(name = "end_time", nullable = false)
    private LocalDateTime endTime; // Calculated as startTime + duration

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true; // Can be set to FALSE if manually stopped or expired
}
