package com.au.cl.controller;

import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.temporal.TemporalAdjusters;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.au.cl.dto.AnnouncementCreateRequest;
import com.au.cl.dto.AnnouncementDTO;
import com.au.cl.dto.AttendanceRecordDTO;
import com.au.cl.dto.AttendanceSessionResponse;
import com.au.cl.dto.AttendanceStatsDTO;
import com.au.cl.dto.DashboardStatsDTO;
import com.au.cl.dto.FeedbackCreateRequest;
import com.au.cl.dto.FeedbackDTO;
import com.au.cl.dto.MissionCreateRequest;
import com.au.cl.dto.MissionDTO;
import com.au.cl.dto.PaymentRequest;
import com.au.cl.dto.ProfileUpdateRequest;
import com.au.cl.dto.TransactionDTO;
import com.au.cl.dto.UserDTO;
import com.au.cl.model.Mission.MissionStatus;
import com.au.cl.model.Role;
import com.au.cl.model.Transaction.TransactionType;
import com.au.cl.model.User;
import com.au.cl.payload.response.ApiResponse;
import com.au.cl.repository.UserRepository;
import com.au.cl.service.AnnouncementService;
import com.au.cl.service.AttendanceService;
import com.au.cl.service.FeedbackService;
import com.au.cl.service.MissionService;
import com.au.cl.service.TransactionService;
import com.au.cl.service.UserService;

import jakarta.validation.Valid;

/**
 * REST Controller for user-related operations, including fetching current user details,
 * admin/avenger management functionalities, and dashboard data.
 */
@RestController
@RequestMapping("/api")
public class UserController {

    private static final Logger logger = LoggerFactory.getLogger(UserController.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final TransactionService transactionService;
    private final MissionService missionService;
    private final AttendanceService attendanceService;
    private final FeedbackService feedbackService;
    private final AnnouncementService announcementService;
    private final UserService userService;

    public UserController(final UserRepository userRepository, final PasswordEncoder passwordEncoder,
                         final TransactionService transactionService, final MissionService missionService,
                         final AttendanceService attendanceService, final FeedbackService feedbackService,
                         final AnnouncementService announcementService, final UserService userService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.transactionService = transactionService;
        this.missionService = missionService;
        this.attendanceService = attendanceService;
        this.feedbackService = feedbackService;
        this.announcementService = announcementService;
        this.userService = userService;
    }

    // --- Common Endpoints ---

    @GetMapping("/user/details")
    @PreAuthorize("hasAnyRole('AVENGER', 'ADMIN')")
    public ResponseEntity<Map<String, String>> getUserDetails(final Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        Map<String, String> userDetails = new HashMap<>();
        userDetails.put("id", user.getId().toString());
        userDetails.put("username", user.getUsername());
        userDetails.put("role", user.getRole().name());
        userDetails.put("email", user.getEmail());
        userDetails.put("isAlive", String.valueOf(user.getAlive()));
        userDetails.put("balance", String.valueOf(user.getBalance()));
        // Only include non-sensitive fields
        logger.info("Fetched details for user: {}", user.getUsername());
        return ResponseEntity.ok(userDetails);
    }

    // --- Admin Endpoints ---

    @GetMapping("/admin/avengers")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UserDTO>> getAllAvengers() {
        List<UserDTO> avengers = userRepository.findByRole(Role.AVENGER).stream()
                .map(user -> new UserDTO(user.getId(), user.getUsername(), user.getEmail(), user.getRole(), user.getBalance(), user.getAlive()))
                .collect(Collectors.toList());
        logger.info("Admin fetched list of {} Avengers.", avengers.size());
        return ResponseEntity.ok(avengers);
    }

    @GetMapping("/admin/dashboard-stats")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<DashboardStatsDTO> getDashboardStats() {
        long totalAvengers = userRepository.countByRole(Role.AVENGER);
        long activeMissions = missionService.countMissionsByStatus(MissionStatus.ONGOING);
        long pendingFeedback = feedbackService.countUnreadFeedback();

        LocalDateTime startOfMonth = LocalDateTime.now().withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0).withNano(0);
        LocalDateTime endOfMonth = LocalDateTime.now().with(TemporalAdjusters.lastDayOfMonth()).withHour(23).withMinute(59).withSecond(59).withNano(999999999);
        double totalPaymentsThisMonth = transactionService.getTotalPaymentsBetween(TransactionType.SALARY, startOfMonth, endOfMonth);

        DashboardStatsDTO stats = new DashboardStatsDTO(totalAvengers, activeMissions, pendingFeedback, totalPaymentsThisMonth);
        logger.info("Admin fetched dashboard stats: {}", stats);
        return ResponseEntity.ok(stats);
    }

    @PostMapping("/admin/payments/send")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse> sendPayment(final Authentication authentication, @Valid @RequestBody final PaymentRequest request) {
        User adminUser = (User) authentication.getPrincipal();
        try {
            transactionService.sendPayment(adminUser, request);
            return ResponseEntity.ok(new ApiResponse(true, "Payment processed successfully!"));
        } catch (IllegalArgumentException e) {
            logger.warn("Payment failed for admin {}: {}", adminUser.getUsername(), e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ApiResponse(false, e.getMessage()));
        } catch (Exception e) {
            logger.error("Error processing payment for admin {}: {}", adminUser.getUsername(), e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new ApiResponse(false, "An unexpected error occurred during payment processing."));
        }
    }

    @GetMapping("/admin/payments/history")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<TransactionDTO>> getAllPaymentHistory() {
        List<TransactionDTO> transactions = transactionService.getAllTransactions();
        logger.info("Admin fetched {} payment records.", transactions.size());
        return ResponseEntity.ok(transactions);
    }

    @PostMapping("/admin/missions")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createMission(final Authentication authentication, @Valid @RequestBody final MissionCreateRequest request) {
        User adminUser = (User) authentication.getPrincipal();
        try {
            MissionDTO mission = missionService.createMission(adminUser, request);
            return ResponseEntity.status(HttpStatus.CREATED).body(mission);
        } catch (IllegalArgumentException e) {
            logger.warn("Mission creation failed for admin {}: {}", adminUser.getUsername(), e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ApiResponse(false, e.getMessage()));
        } catch (Exception e) {
            logger.error("Error creating mission for admin {}: {}", adminUser.getUsername(), e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new ApiResponse(false, "An unexpected error occurred during mission creation."));
        }
    }

    @GetMapping("/admin/missions")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<MissionDTO>> getAllMissions() {
        List<MissionDTO> missions = missionService.getAllMissions();
        logger.info("Admin fetched {} missions.", missions.size());
        return ResponseEntity.ok(missions);
    }

    @PostMapping("/admin/attendance/start")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> startAttendanceSession(final Authentication authentication) {
        User adminUser = (User) authentication.getPrincipal();
        try {
            AttendanceSessionResponse response = attendanceService.startAttendanceSession(adminUser);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error starting attendance session for admin {}: {}", adminUser.getUsername(), e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new ApiResponse(false, "An unexpected error occurred during attendance session start."));
        }
    }

    @GetMapping("/admin/attendance/records")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<AttendanceRecordDTO>> getAllAttendanceRecords() {
        List<AttendanceRecordDTO> records = attendanceService.getAllAttendanceRecords();
        logger.info("Admin fetched {} attendance records.", records.size());
        return ResponseEntity.ok(records);
    }

    @GetMapping("/admin/feedback")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<FeedbackDTO>> getAllFeedback() {
        List<FeedbackDTO> feedback = feedbackService.getAllFeedback();
        logger.info("Admin fetched {} feedback items.", feedback.size());
        return ResponseEntity.ok(feedback);
    }

    @PutMapping("/admin/feedback/{feedbackId}/read")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse> markFeedbackAsRead(@PathVariable final Long feedbackId) {
        try {
            feedbackService.markFeedbackAsRead(feedbackId);
            return ResponseEntity.ok(new ApiResponse(true, "Feedback marked as read."));
        } catch (IllegalArgumentException e) {
            logger.warn("Failed to mark feedback {} as read: {}", feedbackId, e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ApiResponse(false, e.getMessage()));
        } catch (Exception e) {
            logger.error("Error marking feedback {} as read: {}", feedbackId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new ApiResponse(false, "An unexpected error occurred."));
        }
    }

    @PostMapping("/admin/announcements")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createAnnouncement(final Authentication authentication, @Valid @RequestBody final AnnouncementCreateRequest request) {
        User adminUser = (User) authentication.getPrincipal();
        try {
            AnnouncementDTO announcement = announcementService.createAnnouncement(adminUser, request);
            return ResponseEntity.status(HttpStatus.CREATED).body(announcement);
        } catch (Exception e) {
            logger.error("Error creating announcement for admin {}: {}", adminUser.getUsername(), e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new ApiResponse(false, "An unexpected error occurred during announcement creation."));
        }
    }

    @GetMapping("/admin/announcements")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<AnnouncementDTO>> getAllAnnouncements() {
        List<AnnouncementDTO> announcements = announcementService.getAllAnnouncements();
        logger.info("Admin fetched {} announcements.", announcements.size());
        return ResponseEntity.ok(announcements);
    }

    // --- Avenger Endpoints ---

    @GetMapping("/avenger/dashboard-stats")
    @PreAuthorize("hasRole('AVENGER')")
    public ResponseEntity<Map<String, Object>> getAvengerDashboardStats(final Authentication authentication) {
        User avengerUser = (User) authentication.getPrincipal();
        long activeMissions = missionService.countActiveMissionsForAvenger(avengerUser);
        long completedMissions = missionService.countCompletedMissionsForAvenger(avengerUser);
        YearMonth currentMonth = YearMonth.now();
        AttendanceStatsDTO attendanceStats = attendanceService.getAttendanceStatsForAvenger(avengerUser, currentMonth);

        Map<String, Object> stats = new HashMap<>();
        stats.put("activeMissions", activeMissions);
        stats.put("completedMissions", completedMissions);
        stats.put("attendanceRate", attendanceStats.getAttendanceRate());
        stats.put("currentBalance", avengerUser.getBalance());
        logger.info("Avenger {} fetched dashboard stats.", avengerUser.getUsername());
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/avenger/missions/my")
    @PreAuthorize("hasRole('AVENGER')")
    public ResponseEntity<List<MissionDTO>> getMyMissions(final Authentication authentication) {
        User avengerUser = (User) authentication.getPrincipal();
        List<MissionDTO> missions = missionService.getMissionsForAvenger(avengerUser);
        logger.info("Avenger {} fetched {} missions.", avengerUser.getUsername(), missions.size());
        return ResponseEntity.ok(missions);
    }

    @PostMapping("/avenger/attendance/mark")
    @PreAuthorize("hasRole('AVENGER')")
    public ResponseEntity<ApiResponse> markAttendance(@RequestBody final Map<String, String> attendanceRequest, final Authentication authentication) {
        String code = attendanceRequest.get("code");
        if (code == null || code.trim().isEmpty()) {
            logger.warn("Avenger {} attempted to mark attendance with empty code.", authentication.getName());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ApiResponse(false, "Attendance code cannot be empty."));
        }
        User avengerUser = (User) authentication.getPrincipal();
        try {
            attendanceService.markAttendance(avengerUser, code);
            return ResponseEntity.ok(new ApiResponse(true, "Attendance marked successfully!"));
        } catch (IllegalArgumentException e) {
            logger.warn("Avenger {} failed to mark attendance: {}", avengerUser.getUsername(), e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ApiResponse(false, e.getMessage()));
        } catch (Exception e) {
            logger.error("Error marking attendance for Avenger {}: {}", avengerUser.getUsername(), e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new ApiResponse(false, "An unexpected error occurred during attendance marking."));
        }
    }

    @GetMapping("/avenger/attendance/history")
    @PreAuthorize("hasRole('AVENGER')")
    public ResponseEntity<List<AttendanceRecordDTO>> getMyAttendanceHistory(final Authentication authentication) {
        User avengerUser = (User) authentication.getPrincipal();
        List<AttendanceRecordDTO> records = attendanceService.getAttendanceHistoryForAvenger(avengerUser);
        logger.info("Avenger {} fetched {} attendance records.", avengerUser.getUsername(), records.size());
        return ResponseEntity.ok(records);
    }

    @GetMapping("/avenger/attendance/stats/{year}/{month}")
    @PreAuthorize("hasRole('AVENGER')")
    public ResponseEntity<AttendanceStatsDTO> getMyAttendanceStats(
            final Authentication authentication,
            @PathVariable final int year,
            @PathVariable final int month) {
        User avengerUser = (User) authentication.getPrincipal();
        YearMonth yearMonth = YearMonth.of(year, month);
        AttendanceStatsDTO stats = attendanceService.getAttendanceStatsForAvenger(avengerUser, yearMonth);
        logger.info("Avenger {} fetched attendance stats for {}-{}: Days Present: {}, Days Absent: {}, Rate: {}%",
                avengerUser.getUsername(), year, month, stats.getDaysPresent(), stats.getDaysAbsent(), stats.getAttendanceRate());
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/avenger/transactions/history")
    @PreAuthorize("hasRole('AVENGER')")
    public ResponseEntity<List<TransactionDTO>> getMyTransactionHistory(final Authentication authentication) {
        User avengerUser = (User) authentication.getPrincipal();
        List<TransactionDTO> transactions = transactionService.getTransactionsForAvenger(avengerUser);
        logger.info("Avenger {} fetched {} transaction records.", avengerUser.getUsername(), transactions.size());
        return ResponseEntity.ok(transactions);
    }

    @GetMapping("/avenger/earnings/{year}/{month}")
    @PreAuthorize("hasRole('AVENGER')")
    public ResponseEntity<Map<String, Double>> getMonthlyEarnings(
            final Authentication authentication,
            @PathVariable final int year,
            @PathVariable final int month) {
        User avengerUser = (User) authentication.getPrincipal();
        LocalDateTime startOfMonth = LocalDateTime.of(year, month, 1, 0, 0, 0);
        LocalDateTime endOfMonth = startOfMonth.with(TemporalAdjusters.lastDayOfMonth()).withHour(23).withMinute(59).withSecond(59).withNano(999999999);
        double totalEarnings = transactionService.getMonthlyEarningsForAvenger(avengerUser, startOfMonth, endOfMonth);

        Map<String, Double> response = new HashMap<>();
        response.put("totalEarnings", totalEarnings);
        logger.info("Avenger {} fetched monthly earnings for {}-{}: {}", avengerUser.getUsername(), year, month, totalEarnings);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/avenger/feedback")
    @PreAuthorize("hasRole('AVENGER')")
    public ResponseEntity<ApiResponse> submitFeedback(final Authentication authentication, @Valid @RequestBody final FeedbackCreateRequest request) {
        User avengerUser = (User) authentication.getPrincipal();
        try {
            feedbackService.submitFeedback(avengerUser, request);
            return ResponseEntity.ok(new ApiResponse(true, "Feedback submitted successfully!"));
        } catch (Exception e) {
            logger.error("Error submitting feedback for Avenger {}: {}", avengerUser.getUsername(), e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new ApiResponse(false, "An unexpected error occurred during feedback submission."));
        }
    }

    @GetMapping("/avenger/feedback/my")
    @PreAuthorize("hasRole('AVENGER')")
    public ResponseEntity<List<FeedbackDTO>> getMyFeedbackHistory(final Authentication authentication) {
        User avengerUser = (User) authentication.getPrincipal();
        List<FeedbackDTO> feedback = feedbackService.getFeedbackHistoryForAvenger(avengerUser);
        logger.info("Avenger {} fetched {} feedback history items.", avengerUser.getUsername(), feedback.size());
        return ResponseEntity.ok(feedback);
    }

    @GetMapping("/avenger/announcements")
    @PreAuthorize("hasAnyRole('AVENGER', 'ADMIN')")
    public ResponseEntity<List<AnnouncementDTO>> getAllAnnouncementsForAvenger() {
        List<AnnouncementDTO> announcements = announcementService.getAllAnnouncements();
        logger.info("Avenger fetched {} announcements.", announcements.size());
        return ResponseEntity.ok(announcements);
    }

    @PutMapping("/avenger/profile")
    @PreAuthorize("hasRole('AVENGER')")
    public ResponseEntity<?> updateAvengerProfile(final Authentication authentication, @Valid @RequestBody final ProfileUpdateRequest request) {
        User avengerUser = (User) authentication.getPrincipal();
        try {
            UserDTO updatedProfile = userService.updateAvengerProfile(avengerUser, request);
            return ResponseEntity.ok(updatedProfile);
        } catch (IllegalArgumentException e) {
            logger.warn("Profile update failed for Avenger {}: {}", avengerUser.getUsername(), e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ApiResponse(false, e.getMessage()));
        } catch (Exception e) {
            logger.error("Error updating profile for Avenger {}: {}", avengerUser.getUsername(), e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new ApiResponse(false, "An unexpected error occurred during profile update."));
        }
    }

    @PutMapping("/avenger/profile/change-password")
    @PreAuthorize("hasRole('AVENGER')")
    public ResponseEntity<ApiResponse> changePassword(final Authentication authentication, @RequestBody final Map<String, String> request) {
        String newPassword = request.get("newPassword");
        if (newPassword == null || newPassword.length() < 8 || !isStrongPassword(newPassword)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ApiResponse(false, "New password must be at least 8 characters long and contain uppercase, lowercase, number, and special character."));
        }
        User avengerUser = (User) authentication.getPrincipal();
        try {
            userService.changePassword(avengerUser, newPassword);
            return ResponseEntity.ok(new ApiResponse(true, "Password changed successfully!"));
        } catch (Exception e) {
            logger.error("Error changing password for Avenger {}: {}", avengerUser.getUsername(), e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new ApiResponse(false, "An unexpected error occurred during password change."));
        }
    }

    // Utility method for password strength validation
    private boolean isStrongPassword(final String password) {
        return password.matches("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$");
    }

    // For scalability, consider adding pagination to endpoints returning lists.
}