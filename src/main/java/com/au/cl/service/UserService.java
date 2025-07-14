package com.au.cl.service;

import com.au.cl.dto.ProfileUpdateRequest; // Import new DTO
import com.au.cl.dto.UserDTO;
import com.au.cl.model.User;
import com.au.cl.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import jakarta.transaction.Transactional;

import java.util.Optional;

@Service
public class UserService { // This is a new service for general user business logic

    private static final Logger logger = LoggerFactory.getLogger(UserService.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * Retrieves a UserDTO for a given User entity.
     * @param user The User entity.
     * @return A UserDTO.
     */
    public UserDTO getUserDTO(User user) {
        return new UserDTO(user.getId(), user.getUsername(), user.getEmail(), user.getRole(), user.getBalance(), user.getAlive());
    }

    /**
     * Updates an Avenger's profile.
     * @param user The authenticated Avenger user.
     * @param request The profile update request DTO.
     * @return The updated UserDTO.
     * @throws IllegalArgumentException if the email is already taken by another user.
     */
    @Transactional
    public UserDTO updateAvengerProfile(User user, ProfileUpdateRequest request) {
        // Check if email is being changed and if new email is already taken by another user
        if (!user.getEmail().equals(request.getEmail())) {
            if (userRepository.existsByEmail(request.getEmail())) {
                throw new IllegalArgumentException("Email is already taken by another user.");
            }
        }

        // Update fields. Note: 'fullName', 'heroAlias', 'bio', 'skills' are not in User model by default.
        // If these are not mapped to your User entity, they will be ignored or require User model extension.
        user.setUsername(request.getFullName()); // Assuming fullName maps to username for now
        user.setEmail(request.getEmail());
        // For 'heroAlias', 'phone', 'bio', 'skills' - you need to add these fields to your User model
        // For example:
        // user.setHeroAlias(request.getHeroAlias());
        // user.setPhone(request.getPhone());
        // user.setBio(request.getBio());
        // user.setSkills(request.getSkills());

        User updatedUser = userRepository.save(user);
        logger.info("Avenger profile updated for user: {}", updatedUser.getUsername());
        return getUserDTO(updatedUser);
    }

    /**
     * Changes the password for a user.
     * @param user The authenticated user.
     * @param newPassword The new password.
     */
    @Transactional
    public void changePassword(User user, String newPassword) {
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        logger.info("Password changed for user: {}", user.getUsername());
    }

    // You might also want a method to toggle 2FA status if implemented
    // public void toggleTwoFactorAuthentication(User user, boolean enable) { ... }
}
