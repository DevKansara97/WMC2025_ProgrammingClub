package com.au.cl.service;

import com.au.cl.dto.FeedbackDTO;
import com.au.cl.model.Feedback;
import com.au.cl.repository.FeedbackRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

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
     * Retrieves all feedback, ordered by submission date descending.
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
     * Converts a Feedback entity to a FeedbackDTO.
     * @param feedback The Feedback entity.
     * @return The corresponding FeedbackDTO.
     */
    private FeedbackDTO convertToDto(Feedback feedback) {
        FeedbackDTO dto = new FeedbackDTO();
        dto.setId(feedback.getId());
        dto.setAvengerUsername(feedback.getUser().getUsername()); // Assuming user is eagerly fetched or accessible
        dto.setFeedbackText(feedback.getFeedbackText());
        dto.setSubmittedAt(feedback.getSubmittedAt());
        dto.setIsRead(feedback.getIsRead());
        return dto;
    }
}
