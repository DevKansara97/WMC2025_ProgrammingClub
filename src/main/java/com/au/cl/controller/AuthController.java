package com.au.cl.controller;

import com.au.cl.config.JwtConfig;
import com.au.cl.model.Role;
import com.au.cl.model.User;
import com.au.cl.payload.request.LoginRequest;
import com.au.cl.payload.request.UserRegistrationRequest; // New DTO for registration
import com.au.cl.payload.response.ApiResponse;
import com.au.cl.repository.UserRepository;
import com.au.cl.service.UserDetailsServiceImpl;
import com.au.cl.util.JwtUtil;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.slf4j.Logger; // Import for logging
import org.slf4j.LoggerFactory; // Import for logging
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional; // Still needed for refresh token logic or other lookups

/**
 * REST Controller for user authentication operations (login, register, logout, refresh).
 * Handles setting JWTs as HTTP-only cookies upon successful login and token refresh.
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final Logger logger = LoggerFactory.getLogger(AuthController.class); // Logger instance

    private final AuthenticationManager authenticationManager;
    private final UserDetailsServiceImpl userDetailsService;
    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtConfig jwtConfig;

    // Constructor injection for all dependencies
    public AuthController(AuthenticationManager authenticationManager,
                          UserDetailsServiceImpl userDetailsService,
                          JwtUtil jwtUtil,
                          UserRepository userRepository,
                          PasswordEncoder passwordEncoder,
                          JwtConfig jwtConfig) {
        this.authenticationManager = authenticationManager;
        this.userDetailsService = userDetailsService;
        this.jwtUtil = jwtUtil;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtConfig = jwtConfig;
    }

    /**
     * Registers a new user in the system.
     * Uses a dedicated DTO (UserRegistrationRequest) to control which fields are accepted from the client.
     * @param registrationRequest The DTO containing username, email, and password for registration.
     * @return ResponseEntity indicating success or failure of registration.
     */
    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@Valid @RequestBody UserRegistrationRequest registrationRequest) {
        // Check if username already exists
        if (userRepository.existsByUsername(registrationRequest.getUsername())) {
            return new ResponseEntity<>(new ApiResponse(false, "Username is already taken!"), HttpStatus.BAD_REQUEST);
        }

        // Create a new User entity from the DTO
        User newUser = new User();
        newUser.setUsername(registrationRequest.getUsername());
        newUser.setEmail(registrationRequest.getEmail());
        newUser.setPassword(passwordEncoder.encode(registrationRequest.getPassword())); // Hash password
        newUser.setRole(Role.AVENGER); // Set default role
        newUser.setBalance(0.0); // Set default balance
        newUser.setAlive(true); // Set default alive status (assuming this field exists in User model)

        // Save the new user to the database
        userRepository.save(newUser);
        logger.info("User {} registered successfully!", newUser.getUsername());
        return new ResponseEntity<>(new ApiResponse(true, "User registered successfully!"), HttpStatus.CREATED);
    }

    /**
     * Authenticates a user and issues JWTs as HTTP-only cookies.
     * @param loginRequest The request body containing username and password.
     * @param response HttpServletResponse to add cookies to.
     * @return ResponseEntity with user details (username, role) upon successful login.
     */
    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest, HttpServletResponse response) {
        try {
            // Authenticate the user using Spring Security's AuthenticationManager
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword())
            );

            // Set the authenticated user in Spring Security's context
            SecurityContextHolder.getContext().setAuthentication(authentication);

            // Get the authenticated UserDetails. Assuming your User entity implements UserDetails,
            // you can cast the principal directly to avoid an extra DB lookup.
            // If your User entity does NOT implement UserDetails, you would need the userRepository.findByUsername lookup.
            User authenticatedUser = (User) authentication.getPrincipal();

            // Generate Access Token (short-lived)
            final String accessToken = jwtUtil.generateAccessToken(authenticatedUser);
            // Generate Refresh Token (long-lived)
            final String refreshToken = jwtUtil.generateRefreshToken(authenticatedUser);

            // --- Set Access Token as HTTP-Only Cookie ---
            Cookie accessTokenCookie = new Cookie("accessToken", accessToken);
            accessTokenCookie.setHttpOnly(true); // IMPORTANT: Prevents client-side JS access (XSS protection)
            accessTokenCookie.setSecure(false); // Set to true in production with HTTPS
            accessTokenCookie.setPath("/"); // Accessible from all paths on the domain
            accessTokenCookie.setMaxAge((int) (jwtConfig.getAccessTokenExpirationMs() / 1000)); // Max age in seconds
            response.addCookie(accessTokenCookie);

            // --- Set Refresh Token as HTTP-Only Cookie ---
            Cookie refreshTokenCookie = new Cookie("refreshToken", refreshToken);
            refreshTokenCookie.setHttpOnly(true); // IMPORTANT: Prevents client-side JS access
            refreshTokenCookie.setSecure(false); // Set to true in production with HTTPS
            // Path for refresh token should be specific to the refresh endpoint or a broader /api/auth
            refreshTokenCookie.setPath("/api/auth"); // Accessible from /api/auth and its sub-paths
            refreshTokenCookie.setMaxAge((int) (jwtConfig.getRefreshTokenExpirationMs() / 1000));
            response.addCookie(refreshTokenCookie);

            // Prepare response body with non-sensitive user details for frontend redirection/display
            Map<String, String> responseBody = new HashMap<>();
            responseBody.put("username", authenticatedUser.getUsername());
            responseBody.put("role", authenticatedUser.getRole().name()); // Send the role as a string

            logger.info("User {} logged in successfully with role {}", authenticatedUser.getUsername(), authenticatedUser.getRole());
            return ResponseEntity.ok(responseBody);

        } catch (BadCredentialsException e) {
            logger.warn("Login failed for user {}: Incorrect username or password.", loginRequest.getUsername());
            return new ResponseEntity<>(new ApiResponse(false, "Incorrect username or password."), HttpStatus.UNAUTHORIZED);
        } catch (Exception e) {
            logger.error("An unexpected error occurred during login for user {}: {}", loginRequest.getUsername(), e.getMessage(), e);
            return new ResponseEntity<>(new ApiResponse(false, "An unexpected error occurred during login."), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Logs out the user by invalidating JWT cookies.
     * @param request HttpServletRequest (to potentially read cookie paths if dynamic)
     * @param response HttpServletResponse to add expired cookies to.
     * @return ResponseEntity indicating successful logout.
     */
    @PostMapping("/logout")
    public ResponseEntity<?> logoutUser(HttpServletRequest request, HttpServletResponse response) {
        // Clear Spring Security context
        SecurityContextHolder.clearContext();

        // Expire the access token cookie by setting its max age to 0
        Cookie accessTokenCookie = new Cookie("accessToken", null); // Value can be null or empty
        accessTokenCookie.setHttpOnly(true);
        accessTokenCookie.setSecure(false); // Must match the 'secure' setting used during creation
        accessTokenCookie.setPath("/"); // Must match the 'path' setting used during creation
        accessTokenCookie.setMaxAge(0); // Expires immediately
        response.addCookie(accessTokenCookie);

        // Expire the refresh token cookie
        Cookie refreshTokenCookie = new Cookie("refreshToken", null);
        refreshTokenCookie.setHttpOnly(true);
        refreshTokenCookie.setSecure(false); // Must match the 'secure' setting used during creation
        refreshTokenCookie.setPath("/api/auth"); // Must match the 'path' setting used during creation
        refreshTokenCookie.setMaxAge(0); // Expires immediately
        response.addCookie(refreshTokenCookie);

        logger.info("User logged out successfully.");
        return ResponseEntity.ok(new ApiResponse(true, "Logged out successfully!"));
    }

    /**
     * Refreshes the access token using a valid refresh token.
     * The refresh token is expected to be in an HTTP-only cookie.
     * Issues a new access token cookie upon successful refresh.
     * @param request HttpServletRequest to extract refresh token cookie.
     * @param response HttpServletResponse to set new access token cookie.
     * @return ResponseEntity with new access token details or error.
     */
    @PostMapping("/refresh")
    public ResponseEntity<?> refreshToken(HttpServletRequest request, HttpServletResponse response) {
        String refreshToken = null;

        // Extract refresh token from HTTP-only cookie
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (Cookie cookie : cookies) {
                if ("refreshToken".equals(cookie.getName())) {
                    refreshToken = cookie.getValue();
                    break;
                }
            }
        }

        if (refreshToken == null) {
            logger.warn("Refresh token not found in cookies during refresh request.");
            return new ResponseEntity<>(new ApiResponse(false, "Refresh token not found."), HttpStatus.UNAUTHORIZED);
        }

        try {
            // Validate the refresh token
            String username = jwtUtil.extractUsername(refreshToken);
            UserDetails userDetails = userDetailsService.loadUserByUsername(username);

            if (jwtUtil.validateToken(refreshToken, userDetails)) {
                // Generate a new access token
                String newAccessToken = jwtUtil.generateAccessToken(userDetails);

                // Set the new access token as an HTTP-Only cookie
                Cookie newAccessTokenCookie = new Cookie("accessToken", newAccessToken);
                newAccessTokenCookie.setHttpOnly(true);
                newAccessTokenCookie.setSecure(false); // Set to true in production with HTTPS
                newAccessTokenCookie.setPath("/");
                newAccessTokenCookie.setMaxAge((int) (jwtConfig.getAccessTokenExpirationMs() / 1000));
                response.addCookie(newAccessTokenCookie);

                logger.info("Access token refreshed successfully for user {}", username);
                return ResponseEntity.ok(new ApiResponse(true, "Access token refreshed successfully!"));
            } else {
                logger.warn("Invalid or expired refresh token for user {}.", username);
                return new ResponseEntity<>(new ApiResponse(false, "Invalid or expired refresh token."), HttpStatus.UNAUTHORIZED);
            }
        } catch (Exception e) {
            logger.error("Error during token refresh: {}", e.getMessage(), e);
            return new ResponseEntity<>(new ApiResponse(false, "Error refreshing token."), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
