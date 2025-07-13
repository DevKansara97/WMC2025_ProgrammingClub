package com.au.cl.service;

import com.au.cl.dto.AnnouncementCreateRequest;
import com.au.cl.dto.AnnouncementDTO;
import com.au.cl.model.Announcement;
import com.au.cl.model.User;
import com.au.cl.repository.AnnouncementRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AnnouncementService {

    private static final Logger logger = LoggerFactory.getLogger(AnnouncementService.class);

    private final AnnouncementRepository announcementRepository;

    public AnnouncementService(AnnouncementRepository announcementRepository) {
        this.announcementRepository = announcementRepository;
    }

    /**
     * Creates a new announcement.
     * @param adminUser The admin user posting the announcement.
     * @param request The announcement creation request.
     * @return The created AnnouncementDTO.
     */
    public AnnouncementDTO createAnnouncement(User adminUser, AnnouncementCreateRequest request) {
        Announcement announcement = new Announcement();
        announcement.setTitle(request.getTitle());
        announcement.setContent(request.getContent());
        announcement.setPostedBy(adminUser);
        announcement.setPostedAt(LocalDateTime.now());

        Announcement savedAnnouncement = announcementRepository.save(announcement);
        logger.info("Announcement '{}' posted by admin {}.", savedAnnouncement.getTitle(), adminUser.getUsername());
        return convertToDto(savedAnnouncement);
    }

    /**
     * Retrieves all announcements, ordered by posted date descending.
     * @return List of AnnouncementDTOs.
     */
    public List<AnnouncementDTO> getAllAnnouncements() {
        return announcementRepository.findAllByOrderByPostedAtDesc().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    /**
     * Converts an Announcement entity to an AnnouncementDTO.
     * @param announcement The Announcement entity.
     * @return The corresponding AnnouncementDTO.
     */
    private AnnouncementDTO convertToDto(Announcement announcement) {
        AnnouncementDTO dto = new AnnouncementDTO();
        dto.setId(announcement.getId());
        dto.setTitle(announcement.getTitle());
        dto.setContent(announcement.getContent());
        dto.setPostedByUsername(announcement.getPostedBy().getUsername());
        dto.setPostedAt(announcement.getPostedAt());
        return dto;
    }
}
