// src/main/java/com/au/cl/model/AuthRequest.java

package com.au.cl.model;

import lombok.Data;

@Data // Generates getters and setters
public class AuthRequest {
    private String username;
    private String password;
}