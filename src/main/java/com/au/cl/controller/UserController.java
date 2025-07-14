package com.au.cl.controller;

import com.au.cl.dto.*;
import com.au.cl.model.Mission.MissionStatus;
import com.au.cl.model.Role;
import com.au.cl.model.Transaction.TransactionType;
import com.au.cl.model.User;
import com.au.cl.payload.response.ApiResponse;
import com.au.cl.repository.UserRepository;
import com.au.cl.service.*;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder; // Keep for password changes if handled here
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.temporal.TemporalAdjusters;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * REST Controller for user-related operations, including fetching current user details
 * and admin/avenger specific management functionalities, and dashboard data.
 */
@RestController
@RequestMapping("/api") // Base path for all endpoints in this controller
public class UserController {

    private static final Logger logger = LoggerFactory.getLogger(UserController.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder; // Injected for future use if user updates are handled here
    private final TransactionService transactionService;
    private final MissionService missionService;
    private final AttendanceService attendanceService;
    private final FeedbackService feedbackService;
    private final AnnouncementService announcementService;
    private final UserService userService; // New: Injected UserService

    // Constructor injection for all dependencies
    public UserController(UserRepository userRepository, PasswordEncoder passwordEncoder,
                          TransactionService transactionService, MissionService missionService,
                          AttendanceService attendanceService, FeedbackService feedbackService,
                          AnnouncementService announcementService, UserService userService) { // Added UserService
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.transactionService = transactionService;
        this.missionService = missionService;
        this.attendanceService = attendanceService;
        this.feedbackService = feedbackService;
        this.announcementService = announcementService;
        this.userService = userService; // Initialize new service
    }

    /**
     * Endpoint to fetch details of the currently authenticated user.
     * This endpoint is accessed by both Admin and Avenger dashboards after login.
     * It relies on the 'accessToken' HTTP-only cookie for authentication.
     * @param authentication The Spring Security Authentication object representing the current user.
     * @return ResponseEntity containing username, role, email, isAlive status, and balance.
     */
    @GetMapping("/user/details")
    @PreAuthorize("hasAnyRole('AVENGER', 'ADMIN')") // Accessible by both ADMIN and AVENGER roles
    public ResponseEntity<Map<String, String>> getUserDetails(Authentication authentication) {
        User user = (User) authentication.getPrincipal();

        Map<String, String> userDetails = new HashMap<>();
        userDetails.put("id", user.getId().toString()); // Include ID
        userDetails.put("username", user.getUsername());
        userDetails.put("role", user.getRole().name());
        userDetails.put("email", user.getEmail());
        userDetails.put("isAlive", String.valueOf(user.getAlive()));
        userDetails.put("balance", String.valueOf(user.getBalance()));
        // Add other profile fields if they exist in User model and you want to send them
        // userDetails.put("heroAlias", user.getHeroAlias());
        // userDetails.put("bio", user.getBio());
        // userDetails.put("skills", user.getSkills());
        // userDetails.put("phone", user.getPhone());

        logger.info("Fetched details for user: {}", user.getUsername());
        return ResponseEntity.ok(userDetails);
    }

    // --- Admin Specific Endpoints (already defined, keeping for completeness) ---

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
    public ResponseEntity<ApiResponse> sendPayment(Authentication authentication, @Valid @RequestBody PaymentRequest request) {
        User adminUser = (User) authentication.getPrincipal();
        try {
            transactionService.sendPayment(adminUser, request);
            return ResponseEntity.ok(new ApiResponse(true, "Payment processed successfully!"));
        } catch (IllegalArgumentException e) {
            logger.warn("Payment failed for admin {}: {}", adminUser.getUsername(), e.getMessage());
            return new ResponseEntity<>(new ApiResponse(false, e.getMessage()), HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            logger.error("Error processing payment for admin {}: {}", adminUser.getUsername(), e.getMessage(), e);
            return new ResponseEntity<>(new ApiResponse(false, "An unexpected error occurred during payment processing."), HttpStatus.INTERNAL_SERVER_ERROR);
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
    public ResponseEntity<MissionDTO> createMission(Authentication authentication, @Valid @RequestBody MissionCreateRequest request) {
        User adminUser = (User) authentication.getPrincipal();
        try {
            MissionDTO mission = missionService.createMission(adminUser, request);
            return new ResponseEntity<>(mission, HttpStatus.CREATED);
        } catch (IllegalArgumentException e) {
            logger.warn("Mission creation failed for admin {}: {}", adminUser.getUsername(), e.getMessage());
            return new ResponseEntity<>(null, HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            logger.error("Error creating mission for admin {}: {}", adminUser.getUsername(), e.getMessage(), e);
            return new ResponseEntity<>(null, HttpStatus.INTERNAL_SERVER_ERROR);
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
    public ResponseEntity<AttendanceSessionResponse> startAttendanceSession(Authentication authentication) {
        User adminUser = (User) authentication.getPrincipal();
        try {
            AttendanceSessionResponse response = attendanceService.startAttendanceSession(adminUser);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error starting attendance session for admin {}: {}", adminUser.getUsername(), e.getMessage(), e);
            return new ResponseEntity<>(null, HttpStatus.INTERNAL_SERVER_ERROR);
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
    public ResponseEntity<ApiResponse> markFeedbackAsRead(@PathVariable Long feedbackId) {
        try {
            feedbackService.markFeedbackAsRead(feedbackId);
            return ResponseEntity.ok(new ApiResponse(true, "Feedback marked as read."));
        } catch (IllegalArgumentException e) {
            logger.warn("Failed to mark feedback {} as read: {}", feedbackId, e.getMessage());
            return new ResponseEntity<>(new ApiResponse(false, e.getMessage()), HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            logger.error("Error marking feedback {} as read: {}", feedbackId, e.getMessage(), e);
            return new ResponseEntity<>(new ApiResponse(false, "An unexpected error occurred."), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PostMapping("/admin/announcements")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AnnouncementDTO> createAnnouncement(Authentication authentication, @Valid @RequestBody AnnouncementCreateRequest request) {
        User adminUser = (User) authentication.getPrincipal();
        try {
            AnnouncementDTO announcement = announcementService.createAnnouncement(adminUser, request);
            return new ResponseEntity<>(announcement, HttpStatus.CREATED);
        } catch (Exception e) {
            logger.error("Error creating announcement for admin {}: {}", adminUser.getUsername(), e.getMessage(), e);
            return new ResponseEntity<>(null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/admin/announcements")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<AnnouncementDTO>> getAllAnnouncements() {
        List<AnnouncementDTO> announcements = announcementService.getAllAnnouncements();
        logger.info("Admin fetched {} announcements.", announcements.size());
        return ResponseEntity.ok(announcements);
    }

    // --- Avenger Specific Endpoints (NEW) ---

    /**
     * Avenger endpoint to get their dashboard statistics.
     * @param authentication The Spring Security Authentication object of the current Avenger.
     * @return ResponseEntity with AvengerDashboardStatsDTO.
     */
    @GetMapping("/avenger/dashboard-stats")
    @PreAuthorize("hasRole('AVENGER')")
    public ResponseEntity<Map<String, Object>> getAvengerDashboardStats(Authentication authentication) {
        User avengerUser = (User) authentication.getPrincipal();

        long activeMissions = missionService.countActiveMissionsForAvenger(avengerUser);
        long completedMissions = missionService.countCompletedMissionsForAvenger(avengerUser);

        YearMonth currentMonth = YearMonth.now();
        AttendanceStatsDTO attendanceStats = attendanceService.getAttendanceStatsForAvenger(avengerUser, currentMonth);

        Map<String, Object> stats = new HashMap<>();
        stats.put("activeMissions", activeMissions);
        stats.put("completedMissions", completedMissions);
        stats.put("attendanceRate", attendanceStats.getAttendanceRate());
        stats.put("currentBalance", avengerUser.getBalance()); // Current balance from User object

        logger.info("Avenger {} fetched dashboard stats.", avengerUser.getUsername());
        return ResponseEntity.ok(stats);
    }

    /**
     * Avenger endpoint to get their assigned missions.
     * @param authentication The Spring Security Authentication object of the current Avenger.
     * @return ResponseEntity with a list of MissionDTOs.
     */
    @GetMapping("/avenger/missions/my")
    @PreAuthorize("hasRole('AVENGER')")
    public ResponseEntity<List<MissionDTO>> getMyMissions(Authentication authentication) {
        User avengerUser = (User) authentication.getPrincipal();
        List<MissionDTO> missions = missionService.getMissionsForAvenger(avengerUser);
        logger.info("Avenger {} fetched {} missions.", avengerUser.getUsername(), missions.size());
        return ResponseEntity.ok(missions);
    }

    /**
     * Avenger endpoint to mark their attendance using a generated code.
     * @param attendanceRequest Map containing the attendance code.
     * @param authentication The Spring Security Authentication object of the current Avenger.
     * @return ResponseEntity indicating success or failure of marking attendance.
     */
    @PostMapping("/avenger/attendance/mark")
    @PreAuthorize("hasRole('AVENGER')")
    public ResponseEntity<ApiResponse> markAttendance(@RequestBody Map<String, String> attendanceRequest, Authentication authentication) {
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

    /**
     * Avenger endpoint to get their attendance history.
     * @param authentication The Spring Security Authentication object of the current Avenger.
     * @return ResponseEntity with a list of AttendanceRecordDTOs.
     */
    @GetMapping("/avenger/attendance/history")
    @PreAuthorize("hasRole('AVENGER')")
    public ResponseEntity<List<AttendanceRecordDTO>> getMyAttendanceHistory(Authentication authentication) {
        User avengerUser = (User) authentication.getPrincipal();
        List<AttendanceRecordDTO> records = attendanceService.getAttendanceHistoryForAvenger(avengerUser);
        logger.info("Avenger {} fetched {} attendance records.", avengerUser.getUsername(), records.size());
        return ResponseEntity.ok(records);
    }

    /**
     * Avenger endpoint to get their attendance stats for a specific month.
     * @param authentication The Spring Security Authentication object of the current Avenger.
     * @param year The year for which to get stats.
     * @param month The month (1-12) for which to get stats.
     * @return ResponseEntity with AttendanceStatsDTO.
     */
    @GetMapping("/avenger/attendance/stats/{year}/{month}")
    @PreAuthorize("hasRole('AVENGER')")
    public ResponseEntity<AttendanceStatsDTO> getMyAttendanceStats(
            Authentication authentication,
            @PathVariable int year,
            @PathVariable int month) {
        User avengerUser = (User) authentication.getPrincipal();
        YearMonth yearMonth = YearMonth.of(year, month);
        AttendanceStatsDTO stats = attendanceService.getAttendanceStatsForAvenger(avengerUser, yearMonth);
        logger.info("Avenger {} fetched attendance stats for {}-{}: Days Present: {}, Days Absent: {}, Rate: {}%",
                avengerUser.getUsername(), year, month, stats.getDaysPresent(), stats.getDaysAbsent(), stats.getAttendanceRate());
        return ResponseEntity.ok(stats);
    }

    /**
     * Avenger endpoint to get their transaction history.
     * @param authentication The Spring Security Authentication object of the current Avenger.
     * @return ResponseEntity with a list of TransactionDTOs.
     */
    @GetMapping("/avenger/transactions/history")
    @PreAuthorize("hasRole('AVENGER')")
    public ResponseEntity<List<TransactionDTO>> getMyTransactionHistory(Authentication authentication) {
        User avengerUser = (User) authentication.getPrincipal();
        List<TransactionDTO> transactions = transactionService.getTransactionsForAvenger(avengerUser);
        logger.info("Avenger {} fetched {} transaction records.", avengerUser.getUsername(), transactions.size());
        return ResponseEntity.ok(transactions);
    }

    /**
     * Avenger endpoint to get their monthly earnings.
     * @param authentication The Spring Security Authentication object of the current Avenger.
     * @param year The year for which to get earnings.
     * @param month The month (1-12) for which to get earnings.
     * @return ResponseEntity with a map containing total earnings.
     */
    @GetMapping("/avenger/earnings/{year}/{month}")
    @PreAuthorize("hasRole('AVENGER')")
    public ResponseEntity<Map<String, Double>> getMonthlyEarnings(
            Authentication authentication,
            @PathVariable int year,
            @PathVariable int month) {
        User avengerUser = (User) authentication.getPrincipal();
        LocalDateTime startOfMonth = LocalDateTime.of(year, month, 1, 0, 0, 0);
        LocalDateTime endOfMonth = startOfMonth.with(TemporalAdjusters.lastDayOfMonth()).withHour(23).withMinute(59).withSecond(59).withNano(999999999);
        double totalEarnings = transactionService.getMonthlyEarningsForAvenger(avengerUser, startOfMonth, endOfMonth);

        Map<String, Double> response = new HashMap<>();
        response.put("totalEarnings", totalEarnings);
        logger.info("Avenger {} fetched monthly earnings for {}-{}: {}", avengerUser.getUsername(), year, month, totalEarnings);
        return ResponseEntity.ok(response);
    }

    /**
     * Avenger endpoint to submit feedback.
     * @param authentication The Spring Security Authentication object of the current Avenger.
     * @param request FeedbackCreateRequest DTO containing feedback details.
     * @return ResponseEntity indicating success or failure.
     */
    @PostMapping("/avenger/feedback")
    @PreAuthorize("hasRole('AVENGER')")
    public ResponseEntity<ApiResponse> submitFeedback(Authentication authentication, @Valid @RequestBody FeedbackCreateRequest request) {
        User avengerUser = (User) authentication.getPrincipal();
        try {
            feedbackService.submitFeedback(avengerUser, request);
            return ResponseEntity.ok(new ApiResponse(true, "Feedback submitted successfully!"));
        } catch (Exception e) {
            logger.error("Error submitting feedback for Avenger {}: {}", avengerUser.getUsername(), e.getMessage(), e);
            return new ResponseEntity<>(new ApiResponse(false, "An unexpected error occurred during feedback submission."), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Avenger endpoint to get their feedback history.
     * @param authentication The Spring Security Authentication object of the current Avenger.
     * @return ResponseEntity with a list of FeedbackDTOs.
     */
    @GetMapping("/avenger/feedback/my")
    @PreAuthorize("hasRole('AVENGER')")
    public ResponseEntity<List<FeedbackDTO>> getMyFeedbackHistory(Authentication authentication) {
        User avengerUser = (User) authentication.getPrincipal();
        List<FeedbackDTO> feedback = feedbackService.getFeedbackHistoryForAvenger(avengerUser);
        logger.info("Avenger {} fetched {} feedback history items.", avengerUser.getUsername(), feedback.size());
        return ResponseEntity.ok(feedback);
    }

    /**
     * Avenger endpoint to get all announcements.
     * This reuses the admin endpoint as announcements are generally visible to all.
     * @return ResponseEntity with a list of AnnouncementDTOs.
     */
    @GetMapping("/avenger/announcements")
    @PreAuthorize("hasAnyRole('AVENGER', 'ADMIN')") // Accessible by both
    public ResponseEntity<List<AnnouncementDTO>> getAllAnnouncementsForAvenger() {
        // Reusing the service method that fetches all announcements
        List<AnnouncementDTO> announcements = announcementService.getAllAnnouncements();
        logger.info("Avenger fetched {} announcements.", announcements.size());
        return ResponseEntity.ok(announcements);
    }

    /**
     * Avenger endpoint to update their profile.
     * @param authentication The Spring Security Authentication object of the current Avenger.
     * @param request ProfileUpdateRequest DTO containing updated profile details.
     * @return ResponseEntity with the updated UserDTO.
     */
    @PutMapping("/avenger/profile")
    @PreAuthorize("hasRole('AVENGER')")
    public ResponseEntity<UserDTO> updateAvengerProfile(Authentication authentication, @Valid @RequestBody ProfileUpdateRequest request) {
        User avengerUser = (User) authentication.getPrincipal();
        try {
            UserDTO updatedProfile = userService.updateAvengerProfile(avengerUser, request);
            return ResponseEntity.ok(updatedProfile);
        } catch (IllegalArgumentException e) {
            logger.warn("Profile update failed for Avenger {}: {}", avengerUser.getUsername(), e.getMessage());
            return new ResponseEntity<>(null, HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            logger.error("Error updating profile for Avenger {}: {}", avengerUser.getUsername(), e.getMessage(), e);
            return new ResponseEntity<>(null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Avenger endpoint to change their password.
     * @param authentication The Spring Security Authentication object of the current Avenger.
     * @param request Map containing "newPassword".
     * @return ResponseEntity indicating success or failure.
     */
    @PutMapping("/avenger/profile/change-password")
    @PreAuthorize("hasRole('AVENGER')")
    public ResponseEntity<ApiResponse> changePassword(Authentication authentication, @RequestBody Map<String, String> request) {
        String newPassword = request.get("newPassword");
        if (newPassword == null || newPassword.length() < 8) { // Basic validation
            return new ResponseEntity<>(new ApiResponse(false, "New password must be at least 8 characters long."), HttpStatus.BAD_REQUEST);
        }
        User avengerUser = (User) authentication.getPrincipal();
        try {
            userService.changePassword(avengerUser, newPassword);
            return ResponseEntity.ok(new ApiResponse(true, "Password changed successfully!"));
        } catch (Exception e) {
            logger.error("Error changing password for Avenger {}: {}", avengerUser.getUsername(), e.getMessage(), e);
            return new ResponseEntity<>(new ApiResponse(false, "An unexpected error occurred during password change."), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // You might add an endpoint for toggling 2FA if you implement it
    // @PutMapping("/avenger/profile/toggle-2fa")
    // @PreAuthorize("hasRole('AVENGER')")
    // public ResponseEntity<ApiResponse> toggle2FA(Authentication authentication, @RequestBody Map<String, Boolean> request) { ... }
}
