// src/main/java/com/au/cl/util/JwtUtil.java
package com.au.cl.util;

import com.au.cl.config.JwtConfig; // Import JwtConfig to get expiration times
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;


@Component
public class JwtUtil {

    @Value("${jwt.secret}")
    private String secret;

    private final JwtConfig jwtConfig;

    // Constructor injection for JwtConfig
    public JwtUtil(JwtConfig jwtConfig) {
        this.jwtConfig = jwtConfig;
    }

    private Key getSigningKey() {
        byte[] keyBytes = Decoders.BASE64.decode(secret);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    /**
     * Extracts a specific claim from the JWT token.
     * @param token The JWT token.
     * @param claimsResolver A function to resolve the desired claim from the Claims object.
     * @param <T> The type of the claim to extract.
     * @return The extracted claim.
     */
    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    /**
     * Extracts all claims from the JWT token.
     * @param token The JWT token.
     * @return The Claims object containing all claims.
     */
    private Claims extractAllClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    /**
     * Extracts the username (subject) from the JWT token.
     * @param token The JWT token.
     * @return The username.
     */
    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    /**
     * Extracts the expiration date from the JWT token.
     * @param token The JWT token.
     * @return The expiration Date.
     */
    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    /**
     * Checks if the JWT token is expired.
     * @param token The JWT token.
     * @return True if the token is expired, false otherwise.
     */
    private Boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    /**
     * Generates an Access Token for a given UserDetails.
     * Includes user roles as a claim.
     * @param userDetails The UserDetails object for which to generate the token.
     * @return The generated Access Token string.
     */
    public String generateAccessToken(UserDetails userDetails) {
        Map<String, Object> claims = new HashMap<>();
        // Add roles as a claim, stripping "ROLE_" prefix for cleaner representation in token
        claims.put("roles", userDetails.getAuthorities().stream()
                                .map(a -> a.getAuthority().replace("ROLE_", ""))
                                .collect(Collectors.toList()));
        return createToken(claims, userDetails.getUsername(), jwtConfig.getAccessTokenExpirationMs());
    }

    /**
     * Generates a Refresh Token for a given UserDetails.
     * Refresh tokens typically have fewer claims and longer expiration.
     * @param userDetails The UserDetails object for which to generate the token.
     * @return The generated Refresh Token string.
     */
    public String generateRefreshToken(UserDetails userDetails) {
        Map<String, Object> claims = new HashMap<>();
        // Refresh token typically only needs subject (username) and expiration
        return createToken(claims, userDetails.getUsername(), jwtConfig.getRefreshTokenExpirationMs());
    }

    /**
     * Creates a JWT token with specified claims, subject, and expiration time.
     * @param claims Custom claims to include in the token.
     * @param subject The subject of the token (typically username).
     * @param expirationTime The expiration time in milliseconds.
     * @return The generated JWT string.
     */
    private String createToken(Map<String, Object> claims, String subject, long expirationTime) {
        long now = System.currentTimeMillis();
        return Jwts.builder()
                .setClaims(claims)
                .setSubject(subject)
                .setIssuedAt(new Date(now))
                .setExpiration(new Date(now + expirationTime))
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    /**
     * Validates a JWT token against a UserDetails object.
     * Checks if the username matches and if the token is not expired.
     * @param token The JWT token to validate.
     * @param userDetails The UserDetails object to validate against.
     * @return True if the token is valid, false otherwise.
     */
    public Boolean validateToken(String token, UserDetails userDetails) {
        final String username = extractUsername(token);
        return (username.equals(userDetails.getUsername()) && !isTokenExpired(token));
    }
}
