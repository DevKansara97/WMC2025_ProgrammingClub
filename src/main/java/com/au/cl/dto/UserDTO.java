package com.au.cl.dto;

import com.au.cl.model.Role;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

/**
 * DTO for transferring basic user information (e.g., for lists, dropdowns).
 * Excludes sensitive data like password.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserDTO {
    private Long id;
    private String username;
    private String email;
    private Role role;
    private Double balance;
    private Boolean isAlive; // Use isAlive to match getter name from User model
}
