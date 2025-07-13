package com.au.cl.filter;

import com.au.cl.service.UserDetailsServiceImpl;
import com.au.cl.util.JwtUtil;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.slf4j.Logger; // Import for logging
import org.slf4j.LoggerFactory; // Import for logging
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * JWT Request Filter to intercept incoming requests, extract JWT from cookies (or Authorization header),
 * validate it, and set the authentication in Spring Security's SecurityContext.
 */
@Component
public class JwtRequestFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger(JwtRequestFilter.class); // Logger instance

    private final UserDetailsServiceImpl userDetailsService;
    private final JwtUtil jwtUtil;

    // Constructor injection for dependencies
    public JwtRequestFilter(UserDetailsServiceImpl userDetailsService, JwtUtil jwtUtil) {
        this.userDetailsService = userDetailsService;
        this.jwtUtil = jwtUtil;
    }

    /**
     * This method is executed for every incoming HTTP request.
     * It checks for an Access Token in cookies first, then in the Authorization header.
     * If found and valid, it sets up the security context.
     *
     * @param request The current HTTP request.
     * @param response The current HTTP response.
     * @param chain The filter chain for further processing.
     * @throws ServletException If a servlet-specific error occurs.
     * @throws IOException If an I/O error occurs.
     */
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {

        String accessToken = null;
        String username = null;

        logger.debug("Processing request for URI: {}", request.getRequestURI());

        // 1. Try to get the Access Token from HTTP-only cookies
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (Cookie cookie : cookies) {
                if ("accessToken".equals(cookie.getName())) {
                    accessToken = cookie.getValue();
                    logger.debug("Access token found in cookie for URI: {}", request.getRequestURI());
                    break;
                }
            }
        }

        // 2. Fallback: If no accessToken cookie, try to find it in the Authorization header (for API clients)
        if (accessToken == null) {
            final String authorizationHeader = request.getHeader("Authorization");
            if (authorizationHeader != null && authorizationHeader.startsWith("Bearer ")) {
                accessToken = authorizationHeader.substring(7); // Extract the actual JWT token
                logger.debug("Access token found in Authorization header for URI: {}", request.getRequestURI());
            }
        }

        // 3. If an Access Token is found, attempt to extract username and validate
        if (accessToken != null) {
            try {
                username = jwtUtil.extractUsername(accessToken);
                logger.debug("Username '{}' extracted from token for URI: {}", username, request.getRequestURI());
            } catch (Exception e) {
                // Log the exception if token extraction fails (e.g., malformed, expired, invalid signature)
                logger.warn("Error extracting username or invalid JWT (Access Token) for URI {}: {}", request.getRequestURI(), e.getMessage());
                // If token is invalid, username will be null, and auth won't be set.
                // This is the intended path for invalid tokens.
            }
        }

        // 4. If a username is extracted and no authentication is currently set in the SecurityContext
        if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            UserDetails userDetails = null;
            try {
                userDetails = this.userDetailsService.loadUserByUsername(username);
                logger.debug("UserDetails loaded for user '{}' for URI: {}", username, request.getRequestURI());
            } catch (UsernameNotFoundException e) {
                logger.warn("User '{}' not found in DB for username extracted from token for URI: {}", username, request.getRequestURI());
                // No need to set authentication if user not found.
            }


            if (userDetails != null && jwtUtil.validateToken(accessToken, userDetails)) {
                // If the token is valid, create an authentication token
                UsernamePasswordAuthenticationToken usernamePasswordAuthenticationToken = new UsernamePasswordAuthenticationToken(
                        userDetails, null, userDetails.getAuthorities());

                // Set authentication details from the request
                usernamePasswordAuthenticationToken
                        .setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                // Set the authentication object in the SecurityContext
                SecurityContextHolder.getContext().setAuthentication(usernamePasswordAuthenticationToken);
                logger.debug("Successfully set authentication for user '{}' in SecurityContext for URI: {}.", username, request.getRequestURI());
            } else if (userDetails != null) {
                logger.warn("JWT token validation failed for user '{}' for URI: {} (token might be expired or invalid).", username, request.getRequestURI());
            } else {
                logger.debug("UserDetails could not be loaded for user '{}' or token validation failed for URI: {}.", username, request.getRequestURI());
            }
        } else if (username == null && accessToken != null) {
             logger.debug("Access token found for URI: {} but username could not be extracted (likely invalid token format).", request.getRequestURI());
        } else if (SecurityContextHolder.getContext().getAuthentication() != null) {
             logger.debug("Authentication already exists in SecurityContext for URI: {}", request.getRequestURI());
        } else {
             logger.debug("No access token found or username extracted for URI: {}", request.getRequestURI());
        }


        // 5. Continue the filter chain
        chain.doFilter(request, response);
    }
}
