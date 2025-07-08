/*
 * // src/main/java/com/au/cl/service/UserDetailsServiceImpl.java
 * 
 * package com.au.cl.service;
 * 
 * import com.au.cl.model.User; import com.au.cl.repository.UserRepository;
 * import org.springframework.beans.factory.annotation.Autowired; import
 * org.springframework.security.core.userdetails.UserDetails; import
 * org.springframework.security.core.userdetails.UserDetailsService; import
 * org.springframework.security.core.userdetails.UsernameNotFoundException;
 * import org.springframework.security.core.authority.SimpleGrantedAuthority; //
 * Import this import org.springframework.stereotype.Service;
 * 
 * import java.util.Collections; import java.util.List; import
 * java.util.stream.Collectors;
 * 
 * @Service // Marks this as a Spring service component public class
 * UserDetailsServiceImpl implements UserDetailsService {
 * 
 * @Autowired private UserRepository userRepository;
 * 
 * @Override public UserDetails loadUserByUsername(String username) throws
 * UsernameNotFoundException { User user =
 * userRepository.findByUsername(username) .orElseThrow(() -> new
 * UsernameNotFoundException("User not found with username: " + username));
 * 
 * // Spring Security expects roles to be prefixed with "ROLE_"
 * List<SimpleGrantedAuthority> authorities = Collections.singletonList( new
 * SimpleGrantedAuthority("ROLE_" + user.getRole().name()) );
 * 
 * return new org.springframework.security.core.userdetails.User(
 * user.getUsername(), user.getPassword(), // This is the HASHED password from
 * the DB authorities // Pass the list of authorities ); } }
 */

// src/main/java/com/au/cl/service/UserDetailsServiceImpl.java
package com.au.cl.service;

import com.au.cl.model.User;
import com.au.cl.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Custom implementation of Spring Security's UserDetailsService.
 * Loads user-specific data during the authentication process.
 */
@Service
public class UserDetailsServiceImpl implements UserDetailsService {

    private final UserRepository userRepository;

    // Constructor injection
    public UserDetailsServiceImpl(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * Locates the user based on the username. In the actual authentication process,
     * this method is called by Spring Security to retrieve user details.
     * @param username The username identifying the user whose data is required.
     * @return A UserDetails object (Spring Security's user representation).
     * @throws UsernameNotFoundException if the user could not be found.
     */
    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        // Retrieve user from the database by username
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with username: " + username));

        // Convert the application's Role enum to Spring Security's GrantedAuthority
        // Spring Security expects roles to be prefixed with "ROLE_" (e.g., "ROLE_ADMIN", "ROLE_AVENGER")
        List<SimpleGrantedAuthority> authorities = Collections.singletonList(
            new SimpleGrantedAuthority("ROLE_" + user.getRole().name())
        );

        // Return a Spring Security User object
        return new org.springframework.security.core.userdetails.User(
                user.getUsername(),
                user.getPassword(), // This is the HASHED password from the DB
                authorities // Pass the list of authorities (roles)
        );
    }
}
