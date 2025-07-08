// src/main/java/com/au/cl/dto/UserCreateRequest.java
package com.au.cl.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data; // Added Lombok for brevity

@Data // Generates getters and setters
public class UserCreateRequest {

    @NotBlank(message = "Username cannot be empty.")
    private String username;

    @NotBlank(message = "Email is required.")
    @Email(message = "Please provide a valid email address.")
    private String email;

    @NotBlank(message = "Password is required.")
    @Size(min = 8, message = "Password must be at least 8 characters long.")
    private String password;
}
