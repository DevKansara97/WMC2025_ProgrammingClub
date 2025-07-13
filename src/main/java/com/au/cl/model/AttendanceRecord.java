package com.au.cl.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.io.Serializable;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "attendance_records")
@IdClass(AttendanceRecord.AttendanceRecordId.class) // Specify composite primary key class
public class AttendanceRecord {

    @Id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    private AttendanceSession session;

    @Id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user; // Avenger who marked present

    @Column(name = "marked_at", nullable = false)
    private LocalDateTime markedAt = LocalDateTime.now();

    // Composite Primary Key Class
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AttendanceRecordId implements Serializable {
        private Long session; // Corresponds to the 'id' of the AttendanceSession object
        private Long user;    // Corresponds to the 'id' of the User object
    }
}
