// src/main/java/com/au/cl/payload/response/ApiResponse.java
package com.au.cl.payload.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data // Generates getters, setters, toString, equals, hashCode
@NoArgsConstructor // Generates a no-argument constructor
@AllArgsConstructor // Generates a constructor with all fields
public class ApiResponse {
    private boolean success;
    private String message;
}
