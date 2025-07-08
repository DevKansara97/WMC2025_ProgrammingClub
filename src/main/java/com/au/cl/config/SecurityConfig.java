
// src/main/java/com/au/cl/config/SecurityConfig.java
package com.au.cl.config;

import com.au.cl.filter.JwtRequestFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityCustomizer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtRequestFilter jwtRequestFilter;

    public SecurityConfig(JwtRequestFilter jwtRequestFilter) {
        this.jwtRequestFilter = jwtRequestFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> {})
            .authorizeHttpRequests(authorize -> authorize
                // Public endpoints accessible without authentication
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/", "/index.html", "/register.html").permitAll() // These are HTML pages, permitAll them
                .requestMatchers("/css/**", "/js/**", "/images/**", "/fonts/**", "/videos/**", "/favicon.ico").permitAll() // Static resources, permitAll them

                // Dashboard pages - REQUIRE authentication and specific roles
                .requestMatchers("/admin_dashboard.html").hasRole("ADMIN")
                .requestMatchers("/avenger_dashboard.html").hasRole("AVENGER")
                .requestMatchers("/dashboard.html").hasAnyRole("ADMIN", "AVENGER") // If dashboard.html is a generic dashboard

                // Admin specific API paths - require ADMIN role
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .requestMatchers("/api/users").hasRole("ADMIN")
                .requestMatchers("/api/users/{id}/status").hasRole("ADMIN")
                .requestMatchers("/api/transactions/admin/**").hasRole("ADMIN")
                .requestMatchers("/api/missions").hasRole("ADMIN")
                .requestMatchers("/api/missions/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.GET, "/api/feedback").hasRole("ADMIN")

                // Common authenticated API paths (for both ADMIN and AVENGER)
                .requestMatchers("/api/user/details").hasAnyRole("ADMIN", "AVENGER")
                .requestMatchers("/api/transactions/send").hasAnyRole("ADMIN", "AVENGER")
                .requestMatchers("/api/transactions/history").hasAnyRole("ADMIN", "AVENGER")
                .requestMatchers("/api/announcements").hasAnyRole("ADMIN", "AVENGER")
                .requestMatchers("/api/attendance/stats").hasAnyRole("ADMIN", "AVENGER")

                // Avenger specific API paths - require AVENGER role
                .requestMatchers(HttpMethod.POST, "/api/feedback").hasRole("AVENGER")
                .requestMatchers("/api/missions/my").hasRole("AVENGER")
                .requestMatchers("/api/avenger/attendance/mark").hasRole("AVENGER")

                // All other requests REQUIRE authentication
                .anyRequest().authenticated()
            )
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )
            .addFilterBefore(jwtRequestFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    /**
     * REMOVED: webSecurityCustomizer()
     * It's generally recommended to use .permitAll() in HttpSecurity#authorizeHttpRequests
     * for static resources and public HTML pages, rather than completely ignoring them
     * with WebSecurityCustomizer. This ensures they still pass through the filter chain
     * (e.g., for CORS, logging, or your JwtRequestFilter to potentially set auth if a cookie is present).
     * Only truly ignore if you have performance bottlenecks and are certain no filters are needed.
     */
    // @Bean
    // public WebSecurityCustomizer webSecurityCustomizer() {
    //     return (web) -> web.ignoring().requestMatchers(
    //         // ... paths that were here ...
    //     );
    // }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authenticationConfiguration) throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }
}
