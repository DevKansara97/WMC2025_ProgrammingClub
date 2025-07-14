package com.au.cl.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "feedback")
public class Feedback {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user; // Avenger who submitted feedback

    @Enumerated(EnumType.STRING) // Map enum to String in DB
    @Column(name = "category", nullable = false)
    private FeedbackCategory category; // New field for feedback category

    @Column(name = "subject", nullable = false) // New field for feedback subject
    private String subject;

    @Column(name = "feedback_text", nullable = false, columnDefinition = "TEXT")
    private String feedbackText;

    @Column(name = "submitted_at", nullable = false)
    private LocalDateTime submittedAt = LocalDateTime.now();

    @Column(name = "is_read", nullable = false)
    private Boolean isRead = false; // For admin to track read status

    @Column(name = "is_anonymous", nullable = false) // New field for anonymous submission
    private Boolean isAnonymous = false;

    // Optional: Rating field if you want to store it in DB
    @Column(name = "rating")
    private Integer rating; // 1-5 star rating
}
