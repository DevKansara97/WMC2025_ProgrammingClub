// src/main/java/com/au/cl/repository/UserRepository.java package
package com.au.cl.repository;

import com.au.cl.model.Role;
import com.au.cl.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    Boolean existsByUsername(String username);
    Boolean existsByEmail(String email); // Consider adding this for registration validation

    // New methods for dashboard functionality:
    List<User> findByRole(Role role); // To get all Avengers
    long countByRole(Role role); // To count total Avengers for dashboard stats
}
