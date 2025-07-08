/*
 * // src/main/java/com/au/cl/filter/JwtRequestFilter.java package
 * com.au.cl.filter;
 * 
 * import com.au.cl.service.UserDetailsServiceImpl; import
 * com.au.cl.util.JwtUtil; import jakarta.servlet.FilterChain; import
 * jakarta.servlet.ServletException; import jakarta.servlet.http.Cookie; //
 * Import Cookie import jakarta.servlet.http.HttpServletRequest; import
 * jakarta.servlet.http.HttpServletResponse; import
 * org.springframework.beans.factory.annotation.Autowired; import
 * org.springframework.security.authentication.
 * UsernamePasswordAuthenticationToken; import
 * org.springframework.security.core.context.SecurityContextHolder; import
 * org.springframework.security.core.userdetails.UserDetails; import
 * org.springframework.security.web.authentication.
 * WebAuthenticationDetailsSource; import
 * org.springframework.stereotype.Component; import
 * org.springframework.web.filter.OncePerRequestFilter;
 * 
 * import java.io.IOException;
 * 
 * @Component public class JwtRequestFilter extends OncePerRequestFilter {
 * 
 * @Autowired private UserDetailsServiceImpl userDetailsService;
 * 
 * @Autowired private JwtUtil jwtUtil;
 * 
 * @Override protected void doFilterInternal(HttpServletRequest request,
 * HttpServletResponse response, FilterChain chain) throws ServletException,
 * IOException {
 * 
 * String accessToken = null; String username = null; Cookie[] cookies =
 * request.getCookies(); // Get all cookies from the request
 * 
 * if (cookies != null) { for (Cookie cookie : cookies) { if
 * ("accessToken".equals(cookie.getName())) { // Look for the "accessToken"
 * cookie accessToken = cookie.getValue(); break; } } }
 * 
 * // If no accessToken cookie, try to find it in Authorization header
 * (fallback/for API clients) if (accessToken == null) { final String
 * authorizationHeader = request.getHeader("Authorization"); if
 * (authorizationHeader != null && authorizationHeader.startsWith("Bearer ")) {
 * accessToken = authorizationHeader.substring(7); } }
 * 
 * if (accessToken != null) { try { username =
 * jwtUtil.extractUsername(accessToken); } catch (Exception e) { System.out.
 * println("Error extracting username or invalid JWT (Access Token): " +
 * e.getMessage()); // Consider clearing token if invalid, or let it expire //
 * response.setStatus(HttpServletResponse.SC_UNAUTHORIZED); // return; // Stop
 * processing if token is clearly invalid } }
 * 
 * if (username != null &&
 * SecurityContextHolder.getContext().getAuthentication() == null) { UserDetails
 * userDetails = this.userDetailsService.loadUserByUsername(username);
 * 
 * if (jwtUtil.validateToken(accessToken, userDetails)) {
 * UsernamePasswordAuthenticationToken usernamePasswordAuthenticationToken = new
 * UsernamePasswordAuthenticationToken( userDetails, null,
 * userDetails.getAuthorities()); usernamePasswordAuthenticationToken
 * .setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
 * SecurityContextHolder.getContext().setAuthentication(
 * usernamePasswordAuthenticationToken); } // else { If token is invalid (but
 * username extracted), consider a refresh attempt or logout // This is where a
 * client-side interceptor would detect a 401 and try refresh // For now, if
 * validation fails here, request will eventually hit 403/401 later. // } }
 * chain.doFilter(request, response); } }
 */

// src/main/java/com/au/cl/filter/JwtRequestFilter.java
package com.au.cl.filter;

import com.au.cl.service.UserDetailsServiceImpl;
import com.au.cl.util.JwtUtil;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
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

        // 1. Try to get the Access Token from HTTP-only cookies
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (Cookie cookie : cookies) {
                if ("accessToken".equals(cookie.getName())) {
                    accessToken = cookie.getValue();
                    break;
                }
            }
        }

        // 2. Fallback: If no accessToken cookie, try to find it in the Authorization header (for API clients)
        if (accessToken == null) {
            final String authorizationHeader = request.getHeader("Authorization");
            if (authorizationHeader != null && authorizationHeader.startsWith("Bearer ")) {
                accessToken = authorizationHeader.substring(7); // Extract the actual JWT token
            }
        }

        // 3. If an Access Token is found, attempt to extract username and validate
        if (accessToken != null) {
            try {
                username = jwtUtil.extractUsername(accessToken);
            } catch (Exception e) {
                // Log the exception if token extraction fails (e.g., malformed, expired, invalid signature)
                System.out.println("Error extracting username or invalid JWT (Access Token): " + e.getMessage());
                // Do not set authentication; let the request proceed and be rejected by @PreAuthorize if applicable.
                // Or, you could explicitly send a 401 response here if you want to fail fast for invalid tokens.
            }
        }

        // 4. If a username is extracted and no authentication is currently set in the SecurityContext
        if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            // Load UserDetails for the extracted username
            UserDetails userDetails = this.userDetailsService.loadUserByUsername(username);

            // Validate the token against the loaded UserDetails
            if (jwtUtil.validateToken(accessToken, userDetails)) {
                // If the token is valid, create an authentication token
                UsernamePasswordAuthenticationToken usernamePasswordAuthenticationToken = new UsernamePasswordAuthenticationToken(
                        userDetails, null, userDetails.getAuthorities());

                // Set authentication details from the request
                usernamePasswordAuthenticationToken
                        .setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                // Set the authentication object in the SecurityContext
                SecurityContextHolder.getContext().setAuthentication(usernamePasswordAuthenticationToken);
            }
        }

        // 5. Continue the filter chain
        chain.doFilter(request, response);
    }
}
