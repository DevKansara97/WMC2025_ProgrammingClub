package com.au.cl.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor; // Added
import lombok.AllArgsConstructor; // Added
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.Collections;

/**
 * Represents a user in the CaptainsLedger system.
 * This entity also implements Spring Security's UserDetails interface
 * to integrate seamlessly with Spring Security's authentication and authorization mechanisms.
 */
@Data
@NoArgsConstructor // Added: Generates a no-argument constructor
@AllArgsConstructor // Added: Generates a constructor with all fields
@Entity
@Table(name = "users")
public class User implements UserDetails { // Retained: Implements UserDetails

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String username;

    @Column(nullable = false)
    private String email; // Moved email here for logical grouping

    @Column(nullable = false)
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    @Column(nullable = false) // Added: Assuming it's a required field in the database
    private Double balance = 0.0; // Default to 0.0

    @Column(name = "is_alive", nullable = false) // Added: Maps to 'is_alive' column in DB
    private Boolean alive = true; // Default to true (alive)

    // --- UserDetails Interface Implementations (RETAINED) ---

    /**
     * Returns the authorities granted to the user.
     * In this case, it returns a single authority based on the user's role.
     * Spring Security expects roles to be prefixed with "ROLE_".
     * @return A collection of GrantedAuthority objects.
     */
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }

    /**
     * Returns the password used to authenticate the user.
     * @return The user's hashed password.
     */
    @Override
    public String getPassword() {
        return password;
    }

    /**
     * Returns the username used to authenticate the user.
     * @return The user's username.
     */
    @Override
    public String getUsername() {
        return username;
    }

    /**
     * Indicates whether the user's account has expired.
     * @return True if the user's account is valid (not expired), false otherwise.
     */
    @Override
    public boolean isAccountNonExpired() {
        return true; // Assuming accounts do not expire for this application
    }

    /**
     * Indicates whether the user is locked or unlocked.
     * @return True if the user is not locked, false otherwise.
     */
    @Override
    public boolean isAccountNonLocked() {
        return true; // Assuming accounts are not locked for this application
    }

    /**
     * Indicates whether the user's credentials (password) has expired.
     * @return True if the user's credentials are valid (not expired), false otherwise.
     */
    @Override
    public boolean isCredentialsNonExpired() {
        return true; // Assuming credentials do not expire for this application
    }

    /**
     * Indicates whether the user is enabled or disabled.
     * This maps to the 'alive' status of the user.
     * @return True if the user is enabled, false otherwise.
     */
    @Override
    public boolean isEnabled() {
        return alive; // User is enabled if 'alive' is true
    }
}
