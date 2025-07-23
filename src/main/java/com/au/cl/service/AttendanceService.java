package com.au.cl.service;

import com.au.cl.dto.AttendanceRecordDTO;
import com.au.cl.dto.AttendanceSessionResponse;
import com.au.cl.dto.AttendanceStatsDTO;
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

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime; // <--- Keep this import
import java.time.YearMonth;
import java.time.temporal.TemporalAdjusters;
import java.util.List;
import java.util.Random;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

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
     * Retrieves all attendance records (for admin).
     * @return List of AttendanceRecordDTOs.
     */
    public List<AttendanceRecordDTO> getAllAttendanceRecords() {
        return recordRepository.findAll().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    /**
     * Retrieves attendance history for a specific Avenger.
     * @param avengerUser The Avenger user.
     * @return List of AttendanceRecordDTOs for the given Avenger.
     */
    public List<AttendanceRecordDTO> getAttendanceHistoryForAvenger(User avengerUser) {
        return recordRepository.findByUserOrderByMarkedAtDesc(avengerUser).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    /**
     * Calculates attendance statistics for a specific Avenger for a given month.
     * @param avengerUser The Avenger user.
     * @param yearMonth The YearMonth for which to calculate stats.
     * @return A map containing "daysPresent", "daysAbsent", "attendanceRate".
     */
    public AttendanceStatsDTO getAttendanceStatsForAvenger(User avengerUser, YearMonth yearMonth) {
        // Line 150 refers to this method call, and specifically the parameters passed to countByUserAndMarkedAtBetween
        // Changed startOfMonth and endOfMonth from LocalDate to LocalDateTime
        LocalDateTime startOfMonth = yearMonth.atDay(1).atStartOfDay(); // Correct: 2025-07-01T00:00:00
        LocalDateTime endOfMonth = yearMonth.atEndOfMonth().atTime(23, 59, 59, 999_999_999); // Correct: 2025-07-31T23:59:59.999999999

        // Count actual workdays in the month (excluding weekends)
        long totalWorkDaysInMonth = IntStream.rangeClosed(1, yearMonth.lengthOfMonth()) // Use yearMonth.lengthOfMonth() for clarity
                .mapToObj(day -> LocalDate.of(yearMonth.getYear(), yearMonth.getMonth(), day))
                .filter(date -> date.getDayOfWeek() != DayOfWeek.SATURDAY && date.getDayOfWeek() != DayOfWeek.SUNDAY)
                .count();

        // Count days present from records for the given month
        // Now passing LocalDateTime objects, which will match the repository method
        long daysPresent = recordRepository.countByUserAndMarkedAtBetween(avengerUser, startOfMonth, endOfMonth);

        long daysAbsent = totalWorkDaysInMonth - daysPresent;
        if (daysAbsent < 0) daysAbsent = 0; // Should not happen if logic is correct

        double attendanceRate = 0.0;
        if (totalWorkDaysInMonth > 0) {
            attendanceRate = (double) daysPresent / totalWorkDaysInMonth * 100;
        }

        return new AttendanceStatsDTO(daysPresent, daysAbsent, attendanceRate);
    }

    /**
     * Converts an AttendanceRecord entity to an AttendanceRecordDTO.
     * @param record The AttendanceRecord entity.
     * @return The corresponding AttendanceRecordDTO.
     */
    private AttendanceRecordDTO convertToDto(AttendanceRecord record) {
        AttendanceRecordDTO dto = new AttendanceRecordDTO();
        dto.setSessionId(record.getSession().getId());
        dto.setSessionCode(record.getSession().getAttendanceCode());
        dto.setAvengerUsername(record.getUser().getUsername());
        dto.setMarkedAt(record.getMarkedAt());
        return dto;
    }
}