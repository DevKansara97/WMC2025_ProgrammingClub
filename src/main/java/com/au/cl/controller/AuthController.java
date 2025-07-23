package com.au.cl.controller;

import java.util.HashMap;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.au.cl.config.JwtConfig;
import com.au.cl.model.Role;
import com.au.cl.model.User;
import com.au.cl.payload.request.LoginRequest;
import com.au.cl.payload.request.UserRegistrationRequest;
import com.au.cl.payload.response.ApiResponse;
import com.au.cl.repository.UserRepository;
import com.au.cl.service.UserDetailsServiceImpl;
import com.au.cl.util.JwtUtil;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;

/**
 * REST Controller for user authentication operations (login, register, logout, refresh).
 * Handles setting JWTs as HTTP-only cookies upon successful login and token refresh.
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);

    private final AuthenticationManager authenticationManager;
    private final UserDetailsServiceImpl userDetailsService;
    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtConfig jwtConfig;

    public AuthController(
            final AuthenticationManager authenticationManager,
            final UserDetailsServiceImpl userDetailsService,
            final JwtUtil jwtUtil,
            final UserRepository userRepository,
            final PasswordEncoder passwordEncoder,
            final JwtConfig jwtConfig) {
        this.authenticationManager = authenticationManager;
        this.userDetailsService = userDetailsService;
        this.jwtUtil = jwtUtil;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtConfig = jwtConfig;
    }

    /**
     * Registers a new user in the system.
     */
    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@Valid @RequestBody final UserRegistrationRequest registrationRequest) {
        if (userRepository.existsByUsername(registrationRequest.getUsername())) {
            return new ResponseEntity<>(new ApiResponse(false, "Username is already taken!"), HttpStatus.BAD_REQUEST);
        }

        User newUser = new User();
        newUser.setUsername(registrationRequest.getUsername());
        newUser.setEmail(registrationRequest.getEmail());
        newUser.setPassword(passwordEncoder.encode(registrationRequest.getPassword()));
        newUser.setRole(Role.AVENGER);
        newUser.setBalance(0.0);
        newUser.setAlive(true);

        userRepository.save(newUser);
        logger.info("User {} registered successfully!", newUser.getUsername());
        return new ResponseEntity<>(new ApiResponse(true, "User registered successfully!"), HttpStatus.CREATED);
    }

    /**
     * Authenticates a user and issues JWTs as HTTP-only cookies.
     */
    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody final LoginRequest loginRequest, final HttpServletResponse response) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword())
            );
            SecurityContextHolder.getContext().setAuthentication(authentication);

            User authenticatedUser = (User) authentication.getPrincipal();

            final String accessToken = jwtUtil.generateAccessToken(authenticatedUser);
            final String refreshToken = jwtUtil.generateRefreshToken(authenticatedUser);

            // --- Set Access Token as HTTP-Only Cookie ---
            Cookie accessTokenCookie = new Cookie("accessToken", accessToken);
            accessTokenCookie.setHttpOnly(true);
            accessTokenCookie.setSecure(false); // Set to true in production with HTTPS
            accessTokenCookie.setPath("/");
            accessTokenCookie.setMaxAge((int) (jwtConfig.getAccessTokenExpirationMs() / 1000));
            // accessTokenCookie.setAttribute("SameSite", "Strict"); // Uncomment if using Servlet 4.0+
            response.addCookie(accessTokenCookie);

            // --- Set Refresh Token as HTTP-Only Cookie ---
            Cookie refreshTokenCookie = new Cookie("refreshToken", refreshToken);
            refreshTokenCookie.setHttpOnly(true);
            refreshTokenCookie.setSecure(false); // Set to true in production with HTTPS
            refreshTokenCookie.setPath("/api/auth");
            refreshTokenCookie.setMaxAge((int) (jwtConfig.getRefreshTokenExpirationMs() / 1000));
            // refreshTokenCookie.setAttribute("SameSite", "Strict"); // Uncomment if using Servlet 4.0+
            response.addCookie(refreshTokenCookie);

            Map<String, String> responseBody = new HashMap<>();
            responseBody.put("username", authenticatedUser.getUsername());
            responseBody.put("role", authenticatedUser.getRole().name());

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
     */
    @PostMapping("/logout")
    public ResponseEntity<?> logoutUser(final HttpServletRequest request, final HttpServletResponse response) {
        SecurityContextHolder.clearContext();

        Cookie accessTokenCookie = new Cookie("accessToken", null);
        accessTokenCookie.setHttpOnly(true);
        accessTokenCookie.setSecure(false); // Set to true in production with HTTPS
        accessTokenCookie.setPath("/");
        accessTokenCookie.setMaxAge(0);
        // accessTokenCookie.setAttribute("SameSite", "Strict"); // Uncomment if using Servlet 4.0+
        response.addCookie(accessTokenCookie);

        Cookie refreshTokenCookie = new Cookie("refreshToken", null);
        refreshTokenCookie.setHttpOnly(true);
        refreshTokenCookie.setSecure(false); // Set to true in production with HTTPS
        refreshTokenCookie.setPath("/api/auth");
        refreshTokenCookie.setMaxAge(0);
        // refreshTokenCookie.setAttribute("SameSite", "Strict"); // Uncomment if using Servlet 4.0+
        response.addCookie(refreshTokenCookie);

        logger.info("User logged out successfully.");
        return ResponseEntity.ok(new ApiResponse(true, "Logged out successfully!"));
    }

    /**
     * Refreshes the access token using a valid refresh token.
     */
    @PostMapping("/refresh")
    public ResponseEntity<?> refreshToken(final HttpServletRequest request, final HttpServletResponse response) {
        String refreshToken = null;

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
            String username = jwtUtil.extractUsername(refreshToken);
            UserDetails userDetails = userDetailsService.loadUserByUsername(username);

            if (jwtUtil.validateToken(refreshToken, userDetails)) {
                String newAccessToken = jwtUtil.generateAccessToken(userDetails);

                Cookie newAccessTokenCookie = new Cookie("accessToken", newAccessToken);
                newAccessTokenCookie.setHttpOnly(true);
                newAccessTokenCookie.setSecure(false); // Set to true in production with HTTPS
                newAccessTokenCookie.setPath("/");
                newAccessTokenCookie.setMaxAge((int) (jwtConfig.getAccessTokenExpirationMs() / 1000));
                // newAccessTokenCookie.setAttribute("SameSite", "Strict"); // Uncomment if using Servlet 4.0+
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