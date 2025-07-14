package com.au.cl.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

/**
 * DTO for updating an Avenger's profile information.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProfileUpdateRequest {
    @NotBlank(message = "Full name cannot be blank.")
    private String fullName; // Corresponds to username for now, or you can add a new field in User model

    @NotBlank(message = "Hero alias cannot be blank.")
    private String heroAlias; // You might need to add this to your User model if it's a separate field

    @NotBlank(message = "Email is required.")
    @Email(message = "Please provide a valid email address.")
    private String email;

    private String phone; // Optional

    @Size(max = 1000, message = "Bio cannot exceed 1000 characters.")
    private String bio; // You might need to add this to your User model

    private String skills; // You might need to add this to your User model
}
