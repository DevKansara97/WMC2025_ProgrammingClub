package com.au.cl.repository;

import com.au.cl.model.Feedback;
import com.au.cl.model.User; // Import User
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FeedbackRepository extends JpaRepository<Feedback, Long> {
    // Find all unread feedback (for admin dashboard)
    List<Feedback> findByIsReadFalse();

    // Count unread feedback (for dashboard stats)
    long countByIsReadFalse();

    // New: Find feedback submitted by a specific user
    List<Feedback> findByUserOrderBySubmittedAtDesc(User user);
}
