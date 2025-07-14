package com.au.cl.service;

import com.au.cl.dto.FeedbackCreateRequest; // Import new DTO
import com.au.cl.dto.FeedbackDTO;
import com.au.cl.model.Feedback;
import com.au.cl.model.User; // Import User
import com.au.cl.repository.FeedbackRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class FeedbackService {

    private static final Logger logger = LoggerFactory.getLogger(FeedbackService.class);

    private final FeedbackRepository feedbackRepository;

    public FeedbackService(FeedbackRepository feedbackRepository) {
        this.feedbackRepository = feedbackRepository;
    }

    /**
     * Retrieves all feedback, ordered by submission date descending (for admin).
     * @return List of FeedbackDTOs.
     */
    public List<FeedbackDTO> getAllFeedback() {
        return feedbackRepository.findAll().stream() // Assuming findAll returns ordered by ID or default
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    /**
     * Marks a specific feedback as read.
     * @param feedbackId The ID of the feedback to mark as read.
     * @throws IllegalArgumentException if feedback not found.
     */
    public void markFeedbackAsRead(Long feedbackId) {
        Feedback feedback = feedbackRepository.findById(feedbackId)
                .orElseThrow(() -> new IllegalArgumentException("Feedback not found with ID: " + feedbackId));
        feedback.setIsRead(true);
        feedbackRepository.save(feedback);
        logger.info("Feedback with ID {} marked as read.", feedbackId);
    }

    /**
     * Counts the number of unread feedback items.
     * @return Count of unread feedback.
     */
    public long countUnreadFeedback() {
        return feedbackRepository.countByIsReadFalse();
    }

    /**
     * Submits new feedback from an Avenger.
     * @param avengerUser The Avenger user submitting feedback.
     * @param request The feedback creation request.
     * @return The created FeedbackDTO.
     */
    public FeedbackDTO submitFeedback(User avengerUser, FeedbackCreateRequest request) {
        Feedback feedback = new Feedback();
        feedback.setUser(avengerUser);
        feedback.setCategory(request.getCategory());
        feedback.setSubject(request.getSubject());
        feedback.setFeedbackText(request.getFeedbackText());
        feedback.setIsAnonymous(request.getIsAnonymous());
        feedback.setRating(request.getRating()); // Set rating
        feedback.setSubmittedAt(LocalDateTime.now());
        feedback.setIsRead(false); // New feedback is unread by default

        Feedback savedFeedback = feedbackRepository.save(feedback);
        logger.info("Feedback submitted by Avenger {} (Anonymous: {}): Category: {}, Subject: {}",
                avengerUser.getUsername(), request.getIsAnonymous(), request.getCategory(), request.getSubject());
        return convertToDto(savedFeedback);
    }

    /**
     * Retrieves feedback history for a specific Avenger.
     * @param avengerUser The Avenger user.
     * @return List of FeedbackDTOs for the given Avenger.
     */
    public List<FeedbackDTO> getFeedbackHistoryForAvenger(User avengerUser) {
        return feedbackRepository.findByUserOrderBySubmittedAtDesc(avengerUser).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    /**
     * Converts a Feedback entity to a FeedbackDTO.
     * @param feedback The Feedback entity.
     * @return The corresponding FeedbackDTO.
     */
    private FeedbackDTO convertToDto(Feedback feedback) {
        FeedbackDTO dto = new FeedbackDTO();
        dto.setId(feedback.getId());
        dto.setAvengerUsername(feedback.getUser().getUsername());
        dto.setFeedbackText(feedback.getFeedbackText());
        dto.setSubmittedAt(feedback.getSubmittedAt());
        dto.setIsRead(feedback.getIsRead());
        // Include new fields in DTO if needed for display (e.g., category, subject, rating, isAnonymous)
        // For now, only basic fields are mapped. Extend FeedbackDTO if you need them.
        return dto;
    }
}
