/*
 * // src/main/java/com/au/cl/model/AuthResponse.java
 * 
 * package com.au.cl.model;
 * 
 * import lombok.AllArgsConstructor; import lombok.Data; import
 * lombok.NoArgsConstructor;
 * 
 * @Data // Generates getters and setters
 * 
 * @AllArgsConstructor // Generates a constructor with all fields
 * 
 * @NoArgsConstructor // Generates a no-argument constructor public class
 * AuthResponse { private String jwtToken; private Long userId; private String
 * username; private Role role; }
 */



// src/main/java/com/au/cl/model/AuthResponse.java
package com.au.cl.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AuthResponse {
    private String accessToken; // Renamed from jwtToken for clarity
    private String refreshToken; // for refreshing access token
    private Long userId;
    private String username;
    private Role role;
}