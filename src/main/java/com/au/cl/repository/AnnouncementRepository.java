package com.au.cl.repository;

import com.au.cl.model.Announcement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AnnouncementRepository extends JpaRepository<Announcement, Long> {
    // Find all announcements ordered by post date descending
    List<Announcement> findAllByOrderByPostedAtDesc();
}
