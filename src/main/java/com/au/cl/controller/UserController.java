package com.au.cl.controller;

import com.au.cl.model.Role;
import com.au.cl.model.User;
import com.au.cl.payload.response.ApiResponse;
import com.au.cl.repository.UserRepository;
import org.slf4j.Logger; // Import for logging
import org.slf4j.LoggerFactory; // Import for logging
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * REST Controller for user-related operations, including fetching current user details
 * and admin/avenger specific management functionalities.
 */
@RestController
@RequestMapping("/api") // Base path for all endpoints in this controller
public class UserController {

    private static final Logger logger = LoggerFactory.getLogger(UserController.class); // Logger instance

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder; // Injected for future use if user updates are handled here

    // Constructor injection for dependencies
    public UserController(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
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
        // If it reaches this method, authentication is guaranteed by @PreAuthorize
        // and the principal is an instance of our User model (because User implements UserDetails).
        User user = (User) authentication.getPrincipal();

        // Prepare response map with non-sensitive user details
        Map<String, String> userDetails = new HashMap<>();
        userDetails.put("username", user.getUsername());
        userDetails.put("role", user.getRole().name()); // Send the role as a string (ADMIN/AVENGER)
        userDetails.put("email", user.getEmail());
        userDetails.put("isAlive", String.valueOf(user.getAlive())); // Use getAlive() as per Lombok @Data
        userDetails.put("balance", String.valueOf(user.getBalance())); // Add balance

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
    public ResponseEntity<List<Map<String, String>>> getAllAvengers() {
        // Fetch all users and filter by AVENGER role
        List<Map<String, String>> avengers = userRepository.findAll().stream()
                .filter(user -> user.getRole() == Role.AVENGER)
                .map(user -> {
                    Map<String, String> avengerMap = new HashMap<>();
                    avengerMap.put("id", user.getId().toString());
                    avengerMap.put("username", user.getUsername());
                    avengerMap.put("email", user.getEmail());
                    avengerMap.put("isAlive", String.valueOf(user.getAlive()));
                    avengerMap.put("balance", String.valueOf(user.getBalance()));
                    // Add other relevant Avenger details as needed for the catalog page
                    return avengerMap;
                })
                .collect(Collectors.toList());
        logger.info("Admin fetched list of {} Avengers.", avengers.size());
        return ResponseEntity.ok(avengers);
    }

    /**
     * Admin endpoint to start an attendance session and generate a code.
     * @param authentication The Spring Security Authentication object of the current Admin.
     * @return ResponseEntity with the generated attendance code.
     */
    @PostMapping("/admin/attendance/start")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> startAttendanceSession(Authentication authentication) {
        // TODO: Implement actual attendance session creation logic.
        // This should generate a unique, time-sensitive code,
        // store it in the database (e.g., AttendanceSession table),
        // and link it to the admin who generated it.
        String generatedCode = String.format("%06d", (int)(Math.random() * 1000000)); // Generates a random 6-digit code
        String adminUsername = authentication.getName();
        logger.info("Admin {} started an attendance session. Generated code: {}", adminUsername, generatedCode);

        Map<String, String> response = new HashMap<>();
        response.put("code", generatedCode);
        response.put("message", "Attendance session started. Code generated.");
        return ResponseEntity.ok(response);
    }

    /**
     * Admin endpoint to send payments to Avengers.
     * This is a placeholder for the payment logic.
     * @param paymentDetails Map containing payment information (recipientUsername, amount, paymentType, advancedAmount).
     * Consider creating a dedicated DTO (e.g., PaymentRequest) for type safety and validation.
     * @return ResponseEntity indicating success or failure of the payment.
     */
    @PostMapping("/admin/payments/send")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse> sendPayment(@RequestBody Map<String, Object> paymentDetails) {
        // TODO: Implement actual payment logic here.
        // This would involve:
        // 1. Validating input (recipient exists, amount is valid).
        // 2. Handling "advanced money mode" (splitting payment, marking pending approval).
        // 3. Updating user balances in the 'users' table.
        // 4. Recording the transaction in the 'transactions' table.
        // 5. Potentially sending email notifications.

        logger.info("Admin processing payment request: {}", paymentDetails);

        // Simulate a successful payment for now
        return ResponseEntity.ok(new ApiResponse(true, "Payment request processed successfully!"));
    }

    // --- Avenger Specific Endpoints ---

    /**
     * Avenger endpoint to mark their attendance using a generated code.
     * @param attendanceRequest Map containing the attendance code.
     * Consider creating a dedicated DTO (e.g., MarkAttendanceRequest) for type safety and validation.
     * @param authentication The Spring Security Authentication object of the current Avenger.
     * @return ResponseEntity indicating success or failure of marking attendance.
     */
    @PostMapping("/avenger/attendance/mark")
    @PreAuthorize("hasRole('AVENGER')") // Only accessible by users with AVENGER role
    public ResponseEntity<ApiResponse> markAttendance(@RequestBody Map<String, String> attendanceRequest, Authentication authentication) {
        String username = authentication.getName(); // Get the username of the authenticated Avenger
        String code = attendanceRequest.get("code"); // Get the attendance code from the request

        // TODO: Implement actual attendance marking logic here.
        // This would involve:
        // 1. Fetching the active attendance session from the 'attendance_sessions' table using the code.
        // 2. Checking if the session is active and not expired.
        // 3. Checking if the current Avenger (username) has already marked attendance for this session.
        // 4. Recording the attendance in the 'attendance_records' table.

        if (code == null || code.trim().isEmpty()) {
            logger.warn("Avenger {} attempted to mark attendance with empty code.", username);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ApiResponse(false, "Attendance code cannot be empty."));
        }

        // Simulate successful attendance for a specific dummy code
        // Replace "123456" with dynamic code validation against your database
        if ("123456".equals(code)) {
            logger.info("Avenger {} marked attendance with code: {}", username, code);
            return ResponseEntity.ok(new ApiResponse(true, "Attendance marked successfully!"));
        } else {
            logger.warn("Avenger {} attempted to mark attendance with invalid code: {}", username, code);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ApiResponse(false, "Invalid or expired attendance code."));
        }
    }
}
