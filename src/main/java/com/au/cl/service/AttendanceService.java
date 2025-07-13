package com.au.cl.service;

import com.au.cl.dto.AttendanceRecordDTO;
import com.au.cl.dto.AttendanceSessionResponse;
import com.au.cl.model.AttendanceRecord;
import com.au.cl.model.AttendanceSession;
import com.au.cl.model.User;
import com.au.cl.repository.AttendanceRecordRepository;
import com.au.cl.repository.AttendanceSessionRepository;
import com.au.cl.repository.UserRepository;
import jakarta.transaction.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Random;
import java.util.stream.Collectors;

@Service
public class AttendanceService {

    private static final Logger logger = LoggerFactory.getLogger(AttendanceService.class);

    private final AttendanceSessionRepository sessionRepository;
    private final AttendanceRecordRepository recordRepository;
    private final UserRepository userRepository;

    @Value("${attendance.session.duration.seconds:60}") // Configurable duration for attendance code validity
    private long attendanceSessionDurationSeconds;

    public AttendanceService(AttendanceSessionRepository sessionRepository, AttendanceRecordRepository recordRepository, UserRepository userRepository) {
        this.sessionRepository = sessionRepository;
        this.recordRepository = recordRepository;
        this.userRepository = userRepository;
    }

    /**
     * Starts a new attendance session and generates a unique code.
     * @param adminUser The admin user initiating the session.
     * @return AttendanceSessionResponse containing the generated code and session details.
     */
    @Transactional
    public AttendanceSessionResponse startAttendanceSession(User adminUser) {
        String code;
        boolean uniqueCodeFound = false;
        Random random = new Random();
        // Generate a unique 6-digit code
        do {
            code = String.format("%06d", random.nextInt(1000000));
            if (sessionRepository.findByAttendanceCodeAndIsActiveTrue(code).isEmpty()) {
                uniqueCodeFound = true;
            }
        } while (!uniqueCodeFound);

        LocalDateTime startTime = LocalDateTime.now();
        LocalDateTime endTime = startTime.plusSeconds(attendanceSessionDurationSeconds);

        AttendanceSession session = new AttendanceSession();
        session.setAdminUser(adminUser);
        session.setAttendanceCode(code);
        session.setStartTime(startTime);
        session.setEndTime(endTime);
        session.setIsActive(true); // Ensure it's active

        AttendanceSession savedSession = sessionRepository.save(session);
        logger.info("Attendance session started by admin {} with code {}. Valid until {}", adminUser.getUsername(), code, endTime);

        return new AttendanceSessionResponse(savedSession.getId(), savedSession.getAttendanceCode(), savedSession.getStartTime(), savedSession.getEndTime(), "Attendance session started successfully.");
    }

    /**
     * Marks attendance for an Avenger using a given code.
     * @param avengerUser The Avenger user marking attendance.
     * @param attendanceCode The code provided by the Avenger.
     * @throws IllegalArgumentException if code is invalid/expired or attendance already marked.
     */
    @Transactional
    public void markAttendance(User avengerUser, String attendanceCode) {
        AttendanceSession activeSession = sessionRepository.findByAttendanceCodeAndIsActiveTrue(attendanceCode)
                .orElseThrow(() -> new IllegalArgumentException("Invalid or expired attendance code."));

        // Check if session is still active based on time
        if (LocalDateTime.now().isAfter(activeSession.getEndTime())) {
            activeSession.setIsActive(false); // Mark as inactive if expired
            sessionRepository.save(activeSession);
            throw new IllegalArgumentException("Attendance session has expired.");
        }

        // Check if Avenger has already marked attendance for this session
        if (recordRepository.existsBySessionIdAndUserId(activeSession.getId(), avengerUser.getId())) {
            throw new IllegalArgumentException("You have already marked attendance for this session.");
        }

        AttendanceRecord record = new AttendanceRecord();
        record.setSession(activeSession);
        record.setUser(avengerUser);
        record.setMarkedAt(LocalDateTime.now());

        recordRepository.save(record);
        logger.info("Avenger {} marked attendance for session code {}", avengerUser.getUsername(), attendanceCode);
    }

    /**
     * Retrieves all attendance records.
     * @return List of AttendanceRecordDTOs.
     */
    public List<AttendanceRecordDTO> getAllAttendanceRecords() {
        return recordRepository.findAll().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    /**
     * Converts an AttendanceRecord entity to an AttendanceRecordDTO.
     * @param record The AttendanceRecord entity.
     * @return The corresponding AttendanceRecordDTO.
     */
    private AttendanceRecordDTO convertToDto(AttendanceRecord record) {
        AttendanceRecordDTO dto = new AttendanceRecordDTO();
        // Removed: dto.setId(record.getId()); as AttendanceRecord uses a composite key
        dto.setSessionId(record.getSession().getId());
        dto.setSessionCode(record.getSession().getAttendanceCode());
        dto.setAvengerUsername(record.getUser().getUsername());
        dto.setMarkedAt(record.getMarkedAt());
        return dto;
    }
}
