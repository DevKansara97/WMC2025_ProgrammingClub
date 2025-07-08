/*
 * package com.au.cl.config;
 * 
 * import org.springframework.context.annotation.Bean; import
 * org.springframework.context.annotation.Configuration; import
 * org.springframework.security.config.annotation.web.builders.HttpSecurity;
 * import org.springframework.security.config.annotation.web.configuration.
 * EnableWebSecurity; import
 * org.springframework.security.config.http.SessionCreationPolicy; import
 * org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder; import
 * org.springframework.security.crypto.password.PasswordEncoder; import
 * org.springframework.security.web.SecurityFilterChain; import
 * org.springframework.security.authentication.AuthenticationManager; import
 * org.springframework.security.config.annotation.authentication.configuration.
 * AuthenticationConfiguration; import
 * org.springframework.security.config.annotation.web.builders.WebSecurity;
 * import org.springframework.security.config.annotation.web.configuration.
 * WebSecurityCustomizer;
 * 
 * 
 * @Configuration
 * 
 * @EnableWebSecurity public class SecurityConfig {
 * 
 * // Defines the security filter chain for specific API endpoints
 * 
 * @Bean public SecurityFilterChain securityFilterChain(HttpSecurity http)
 * throws Exception { http .csrf(csrf -> csrf.disable()) .cors(cors -> {})
 * .authorizeHttpRequests(authorize -> authorize // Temporarily allow
 * unauthenticated access to ALL /api/ paths for debugging
 * .requestMatchers("/api/**").permitAll() // TEMPORARY DEBUGGING CHANGE: PERMIT
 * ALL API CALLS // All other requests REQUIRE authentication (this will only
 * apply to non-/api/** paths now) .anyRequest().authenticated() )
 * .sessionManagement(session -> session
 * .sessionCreationPolicy(SessionCreationPolicy.STATELESS) // Use stateless
 * sessions (for JWT) ); // .addFilterBefore(jwtRequestFilter,
 * UsernamePasswordAuthenticationFilter.class); // Will add this later for JWT
 * 
 * return http.build(); }
 * 
 * // This bean configures WebSecurity to ignore specific paths from the
 * security filter chain entirely. // This is for STATIC RESOURCES that Spring
 * Security should not touch.
 * 
 * @Bean public WebSecurityCustomizer webSecurityCustomizer() { return (web) ->
 * web.ignoring().requestMatchers( "/", // Root path (index.html) "/index.html",
 * // Explicitly index.html "/register.html", // Explicitly register.html
 * "/dashboard.html", // Explicitly dashboard.html "/css/**", // Allow anything
 * in the css folder "/js/**", // Allow anything in the js folder "/images/**",
 * // Allow anything in the images folder "/fonts/**", // Allow anything in the
 * fonts folder "/videos/**", // Allow anything in the videos folder
 * "/favicon.ico" ); }
 * 
 * // Defines a password encoder for hashing passwords
 * 
 * @Bean public PasswordEncoder passwordEncoder() { return new
 * BCryptPasswordEncoder(); }
 * 
 * @Bean public AuthenticationManager
 * authenticationManager(AuthenticationConfiguration
 * authenticationConfiguration) throws Exception { return
 * authenticationConfiguration.getAuthenticationManager(); } }
 */



// src/main/java/com/au/cl/config/SecurityConfig.java
package com.au.cl.config;

import com.au.cl.filter.JwtRequestFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity; // For @PreAuthorize
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityCustomizer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * Spring Security configuration for the CaptainsLedger backend.
 * Enables web security, method security (for @PreAuthorize), and configures JWT authentication.
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity // Enables method-level security (e.g., @PreAuthorize)
public class SecurityConfig {

    private final JwtRequestFilter jwtRequestFilter;

    // Constructor injection for JwtRequestFilter (preferred over field injection)
    public SecurityConfig(JwtRequestFilter jwtRequestFilter) {
        this.jwtRequestFilter = jwtRequestFilter;
    }

    /**
     * Defines the security filter chain for HTTP requests.
     * Configures CSRF, CORS, session management, authorization rules, and adds the JWT filter.
     * @param http HttpSecurity object to configure.
     * @return The configured SecurityFilterChain.
     * @throws Exception if an error occurs during configuration.
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable()) // Disable CSRF for stateless REST APIs (consider re-enabling with proper token handling in production)
            .cors(cors -> {}) // Enable CORS (configuration handled by WebConfig.java)
            .authorizeHttpRequests(authorize -> authorize
                // Public endpoints accessible without authentication
                .requestMatchers("/api/auth/**").permitAll() // Allow registration, login, logout, refresh without authentication
                .requestMatchers("/dashboard.html").permitAll() // If dashboard.html is a generic unauthenticated landing page

                // Admin specific paths - require ADMIN role
                .requestMatchers("/api/admin/**").hasRole("ADMIN") // All paths under /api/admin require ADMIN role
                .requestMatchers("/api/users").hasRole("ADMIN") // For getting all users (e.g., for Admin's Avenger Catalog)
                .requestMatchers("/api/users/{id}/status").hasRole("ADMIN") // Admin can update user status
                .requestMatchers("/api/transactions/admin/**").hasRole("ADMIN") // Admin specific payment features
                .requestMatchers("/api/missions").hasRole("ADMIN") // Admin can create missions
                .requestMatchers("/api/missions/**").hasRole("ADMIN") // Admin can manage missions (update, delete, etc.)
                .requestMatchers(HttpMethod.GET, "/api/feedback").hasRole("ADMIN") // Admin can view feedback

                // Common authenticated paths (for both ADMIN and AVENGER)
                // CORRECTED: Use /api/user/details as per UserController
                .requestMatchers("/api/user/details").hasAnyRole("ADMIN", "AVENGER")
                .requestMatchers("/api/transactions/send").hasAnyRole("ADMIN", "AVENGER") // Both can send money
                .requestMatchers("/api/transactions/history").hasAnyRole("ADMIN", "AVENGER") // Both can view history
                .requestMatchers("/api/announcements").hasAnyRole("ADMIN", "AVENGER") // Announcements are common page
                .requestMatchers("/api/attendance/stats").hasAnyRole("ADMIN", "AVENGER") // Stats are common page

                // Avenger specific paths - require AVENGER role
                .requestMatchers(HttpMethod.POST, "/api/feedback").hasRole("AVENGER") // Avenger submits feedback
                .requestMatchers("/api/missions/my").hasRole("AVENGER") // Avenger views their assigned missions
                .requestMatchers("/api/avenger/attendance/mark").hasRole("AVENGER") // Avenger can mark attendance
                // Add other /api/avenger/** paths here if needed

                // All other requests REQUIRE authentication
                .anyRequest().authenticated() // Any other request must be authenticated
            )
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS) // Use stateless sessions (for JWT)
            )
            // Add the custom JWT filter before Spring Security's default UsernamePasswordAuthenticationFilter
            .addFilterBefore(jwtRequestFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    /**
     * Configures WebSecurity to ignore specific paths from the security filter chain entirely.
     * This is typically for truly static resources that Spring Security should not process,
     * like CSS, JS, images, and the initial login/register HTML pages.
     * HTML files that serve as authenticated dashboards should NOT be ignored here,
     * as they need to be processed by the JWT filter.
     * @return WebSecurityCustomizer to ignore paths.
     */
    @Bean
    public WebSecurityCustomizer webSecurityCustomizer() {
        return (web) -> web.ignoring().requestMatchers(
            "/",                // Root path (index.html)
            "/index.html",      // Explicitly index.html
            "/register.html",   // Explicitly register.html
            // REMOVED: "/admin_dashboard.html", // This should NOT be ignored
            // REMOVED: "/avenger_dashboard.html", // This should NOT be ignored
            "/css/**",          // Allow anything in the css folder
            "/js/**",           // Allow anything in the js folder
            "/images/**",       // Allow anything in the images folder
            "/fonts/**",        // Allow anything in the fonts folder
            "/videos/**",       // Allow anything in the videos folder
            "/favicon.ico"      // Favicon
        );
    }

    /**
     * Defines a password encoder bean for hashing and verifying passwords.
     * @return A BCryptPasswordEncoder instance.
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /**
     * Exposes the AuthenticationManager bean, which is used for authenticating users.
     * @param authenticationConfiguration The AuthenticationConfiguration.
     * @return The AuthenticationManager instance.
     * @throws Exception if an error occurs.
     */
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authenticationConfiguration) throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }
}

