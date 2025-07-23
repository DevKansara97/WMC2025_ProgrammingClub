// src/main/java/config/JwtConfig.java

package com.au.cl.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

@Configuration
public class JwtConfig {

    private final long accessTokenExpirationMs;
    private final long refreshTokenExpirationMs;

    public JwtConfig(@Value("${jwt.access-token-expiration}") long accessTokenExpirationMs,
                     @Value("${jwt.refresh-token-expiration}") long refreshTokenExpirationMs) {
        this.accessTokenExpirationMs = accessTokenExpirationMs;
        this.refreshTokenExpirationMs = refreshTokenExpirationMs;
    }

    public long getAccessTokenExpirationMs() {
        return accessTokenExpirationMs;
    }

    public long getRefreshTokenExpirationMs() {
        return refreshTokenExpirationMs;
    }
}