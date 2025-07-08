package com.au.cl.service;

import com.au.cl.model.User;
import com.au.cl.repository.UserRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Optional;

/**
 * Custom implementation of Spring Security's UserDetailsService.
 * This service is responsible for loading user-specific data during authentication.
 */
@Service
public class UserDetailsServiceImpl implements UserDetailsService {

    private final UserRepository userRepository;

    // Constructor injection for UserRepository
    public UserDetailsServiceImpl(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * Locates the user based on the username. In the actual implementation, the search
     * may be case sensitive, or case insensitive depending on how the implementation
     * instance is configured. In this case, it's case sensitive as per repository.
     *
     * @param username The username identifying the user whose data is required.
     * @return A UserDetails object (which is our com.au.cl.model.User instance).
     * @throws UsernameNotFoundException if the user could not be found or the user has no
     * GrantedAuthority.
     */
    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        // Find the user by username in the database
        Optional<User> userOptional = userRepository.findByUsername(username);

        // If the user is not found, throw UsernameNotFoundException
        if (userOptional.isEmpty()) {
            throw new UsernameNotFoundException("User not found with username: " + username);
        }

        // Return the found User entity. Since com.au.cl.model.User now implements UserDetails,
        // it can be directly returned here.
        return userOptional.get();
    }
}
