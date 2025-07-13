package com.au.cl.controller;

import com.au.cl.dto.*; // Import all DTOs
import com.au.cl.model.Mission.MissionStatus;
import com.au.cl.model.Role;
import com.au.cl.model.Transaction.TransactionType;
import com.au.cl.model.User;
import com.au.cl.payload.response.ApiResponse;
import com.au.cl.repository.UserRepository;
import com.au.cl.service.*; // Import all services
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.temporal.TemporalAdjusters; // Correct import for TemporalAdjusters
import java.util.List;
import java.util.Map;
import java.util.HashMap; // Explicitly import HashMap
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

    // Constructor injection for all dependencies
    public UserController(UserRepository userRepository, PasswordEncoder passwordEncoder,
                          TransactionService transactionService, MissionService missionService,
                          AttendanceService attendanceService, FeedbackService feedbackService,
                          AnnouncementService announcementService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.transactionService = transactionService;
        this.missionService = missionService;
        this.attendanceService = attendanceService;
        this.feedbackService = feedbackService;
        this.announcementService = announcementService;
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
        userDetails.put("username", user.getUsername());
        userDetails.put("role", user.getRole().name());
        userDetails.put("email", user.getEmail());
        userDetails.put("isAlive", String.valueOf(user.getAlive()));
        userDetails.put("balance", String.valueOf(user.getBalance()));

        logger.info("Fetched details for user: {}", user.getUsername());
        return ResponseEntity.ok(userDetails);
    }

    // --- Admin Specific Endpoints ---

    /**
     * Admin endpoint to get a list of all Avengers (users with AVENGER role).
     * @return ResponseEntity with a list of Avenger details.
     */
    @GetMapping("/admin/avengers")
    @PreAuthorize("hasRole('ADMIN')") // Only accessible by users with ADMIN role
    public ResponseEntity<List<UserDTO>> getAllAvengers() {
        List<UserDTO> avengers = userRepository.findByRole(Role.AVENGER).stream()
                .map(user -> new UserDTO(user.getId(), user.getUsername(), user.getEmail(), user.getRole(), user.getBalance(), user.getAlive()))
                .collect(Collectors.toList());
        logger.info("Admin fetched list of {} Avengers.", avengers.size());
        return ResponseEntity.ok(avengers);
    }

    /**
     * Admin endpoint to get aggregated dashboard statistics.
     * @return ResponseEntity with DashboardStatsDTO.
     */
    @GetMapping("/admin/dashboard-stats")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<DashboardStatsDTO> getDashboardStats() {
        long totalAvengers = userRepository.countByRole(Role.AVENGER);
        long activeMissions = missionService.countMissionsByStatus(MissionStatus.ONGOING);
        long pendingFeedback = feedbackService.countUnreadFeedback();

        // Calculate total payments for the current month
        LocalDateTime startOfMonth = LocalDateTime.now().withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0).withNano(0);
        LocalDateTime endOfMonth = LocalDateTime.now().with(TemporalAdjusters.lastDayOfMonth()).withHour(23).withMinute(59).withSecond(59).withNano(999999999);
        double totalPaymentsThisMonth = transactionService.getTotalPaymentsBetween(TransactionType.SALARY, startOfMonth, endOfMonth); // Assuming SALARY is the main payment type for this stat

        DashboardStatsDTO stats = new DashboardStatsDTO(totalAvengers, activeMissions, pendingFeedback, totalPaymentsThisMonth);
        logger.info("Admin fetched dashboard stats: {}", stats);
        return ResponseEntity.ok(stats);
    }


    /**
     * Admin endpoint to send payments to Avengers.
     * @param authentication The Spring Security Authentication object of the current Admin.
     * @param request PaymentRequest DTO containing payment information.
     * @return ResponseEntity indicating success or failure of the payment.
     */
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

    /**
     * Admin endpoint to get all payment records.
     * @return ResponseEntity with a list of TransactionDTOs.
     */
    @GetMapping("/admin/payments/history")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<TransactionDTO>> getAllPaymentHistory() {
        List<TransactionDTO> transactions = transactionService.getAllTransactions();
        logger.info("Admin fetched {} payment records.", transactions.size());
        return ResponseEntity.ok(transactions);
    }

    /**
     * Admin endpoint to create a new mission.
     * @param authentication The Spring Security Authentication object of the current Admin.
     * @param request MissionCreateRequest DTO containing mission details.
     * @return ResponseEntity with the created MissionDTO.
     */
    @PostMapping("/admin/missions")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<MissionDTO> createMission(Authentication authentication, @Valid @RequestBody MissionCreateRequest request) {
        User adminUser = (User) authentication.getPrincipal();
        try {
            MissionDTO mission = missionService.createMission(adminUser, request);
            return new ResponseEntity<>(mission, HttpStatus.CREATED);
        } catch (IllegalArgumentException e) {
            logger.warn("Mission creation failed for admin {}: {}", adminUser.getUsername(), e.getMessage());
            return new ResponseEntity<>(null, HttpStatus.BAD_REQUEST); // Return appropriate error response
        } catch (Exception e) {
            logger.error("Error creating mission for admin {}: {}", adminUser.getUsername(), e.getMessage(), e);
            return new ResponseEntity<>(null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Admin endpoint to get all missions.
     * @return ResponseEntity with a list of MissionDTOs.
     */
    @GetMapping("/admin/missions")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<MissionDTO>> getAllMissions() {
        List<MissionDTO> missions = missionService.getAllMissions();
        logger.info("Admin fetched {} missions.", missions.size());
        return ResponseEntity.ok(missions);
    }

    /**
     * Admin endpoint to start an attendance session and generate a code.
     * @param authentication The Spring Security Authentication object of the current Admin.
     * @return ResponseEntity with the generated attendance code.
     */
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

    /**
     * Admin endpoint to get all attendance records.
     * @return ResponseEntity with a list of AttendanceRecordDTOs.
     */
    @GetMapping("/admin/attendance/records")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<AttendanceRecordDTO>> getAllAttendanceRecords() {
        List<AttendanceRecordDTO> records = attendanceService.getAllAttendanceRecords();
        logger.info("Admin fetched {} attendance records.", records.size());
        return ResponseEntity.ok(records);
    }

    /**
     * Admin endpoint to get all feedback.
     * @return ResponseEntity with a list of FeedbackDTOs.
     */
    @GetMapping("/admin/feedback")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<FeedbackDTO>> getAllFeedback() {
        List<FeedbackDTO> feedback = feedbackService.getAllFeedback();
        logger.info("Admin fetched {} feedback items.", feedback.size());
        return ResponseEntity.ok(feedback);
    }

    /**
     * Admin endpoint to mark feedback as read.
     * @param feedbackId The ID of the feedback to mark as read.
     * @return ResponseEntity indicating success or failure.
     */
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

    /**
     * Admin endpoint to create a new announcement.
     * @param authentication The Spring Security Authentication object of the current Admin.
     * @param request AnnouncementCreateRequest DTO containing announcement details.
     * @return ResponseEntity with the created AnnouncementDTO.
     */
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

    /**
     * Admin endpoint to get all announcements.
     * @return ResponseEntity with a list of AnnouncementDTOs.
     */
    @GetMapping("/admin/announcements")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<AnnouncementDTO>> getAllAnnouncements() {
        List<AnnouncementDTO> announcements = announcementService.getAllAnnouncements();
        logger.info("Admin fetched {} announcements.", announcements.size());
        return ResponseEntity.ok(announcements);
    }

    // --- Avenger Specific Endpoints (already existed, kept for completeness) ---

    /**
     * Avenger endpoint to mark their attendance using a generated code.
     * @param attendanceRequest Map containing the attendance code.
     * @param authentication The Spring Security Authentication object of the current Avenger.
     * @return ResponseEntity indicating success or failure of marking attendance.
     */
    @PostMapping("/avenger/attendance/mark")
    @PreAuthorize("hasRole('AVENGER')") // Only accessible by users with AVENGER role
    public ResponseEntity<ApiResponse> markAttendance(@RequestBody Map<String, String> attendanceRequest, Authentication authentication) {
        String username = authentication.getName(); // Get the username of the authenticated Avenger
        String code = attendanceRequest.get("code"); // Get the attendance code from the request

        if (code == null || code.trim().isEmpty()) {
            logger.warn("Avenger {} attempted to mark attendance with empty code.", username);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ApiResponse(false, "Attendance code cannot be empty."));
        }

        User avengerUser = (User) authentication.getPrincipal();
        try {
            attendanceService.markAttendance(avengerUser, code);
            return ResponseEntity.ok(new ApiResponse(true, "Attendance marked successfully!"));
        } catch (IllegalArgumentException e) {
            logger.warn("Avenger {} failed to mark attendance: {}", username, e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ApiResponse(false, e.getMessage()));
        } catch (Exception e) {
            logger.error("Error marking attendance for Avenger {}: {}", username, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new ApiResponse(false, "An unexpected error occurred during attendance marking."));
        }
    }
}
