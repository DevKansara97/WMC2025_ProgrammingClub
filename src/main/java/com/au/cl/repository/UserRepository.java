// src/main/java/com/au/cl/repository/UserRepository.java
package com.au.cl.repository;

import com.au.cl.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByUsername(String username);
    boolean existsByUsername(String username);
}
