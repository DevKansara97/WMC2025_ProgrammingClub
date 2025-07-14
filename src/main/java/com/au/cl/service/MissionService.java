package com.au.cl.service;

import com.au.cl.dto.MissionCreateRequest;
import com.au.cl.dto.MissionDTO;
import com.au.cl.dto.UserDTO;
import com.au.cl.model.Mission;
import com.au.cl.model.Mission.MissionStatus;
import com.au.cl.model.MissionParticipant;
import com.au.cl.model.User;
import com.au.cl.repository.MissionParticipantRepository;
import com.au.cl.repository.MissionRepository;
import com.au.cl.repository.UserRepository;
import jakarta.transaction.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class MissionService {

    private static final Logger logger = LoggerFactory.getLogger(MissionService.class);

    private final MissionRepository missionRepository;
    private final UserRepository userRepository;
    private final MissionParticipantRepository missionParticipantRepository;

    public MissionService(MissionRepository missionRepository, UserRepository userRepository, MissionParticipantRepository missionParticipantRepository) {
        this.missionRepository = missionRepository;
        this.userRepository = userRepository;
        this.missionParticipantRepository = missionParticipantRepository;
    }

    /**
     * Creates a new mission and assigns participants.
     * @param adminUser The admin user creating the mission.
     * @param request The mission creation request.
     * @return The created MissionDTO.
     * @throws IllegalArgumentException if participants are not found.
     */
    @Transactional
    public MissionDTO createMission(User adminUser, MissionCreateRequest request) {
        Mission mission = new Mission();
        mission.setMissionName(request.getMissionName());
        mission.setDescription(request.getDescription());
        mission.setStatus(request.getStatus());
        mission.setAssignedBy(adminUser);

        Mission savedMission = missionRepository.save(mission);

        List<User> participants = userRepository.findAllById(request.getParticipantUserIds());
        if (participants.size() != request.getParticipantUserIds().size()) {
            logger.warn("Some participants not found for mission creation: {}", request.getParticipantUserIds());
            throw new IllegalArgumentException("One or more participant users not found.");
        }

        for (User participant : participants) {
            MissionParticipant missionParticipant = new MissionParticipant();
            missionParticipant.setMission(savedMission);
            missionParticipant.setUser(participant);
            missionParticipantRepository.save(missionParticipant);
        }

        logger.info("Mission '{}' created by admin {} with {} participants.", savedMission.getMissionName(), adminUser.getUsername(), participants.size());
        return convertToDto(savedMission);
    }

    /**
     * Retrieves all missions.
     * @return List of MissionDTOs.
     */
    public List<MissionDTO> getAllMissions() {
        return missionRepository.findAll().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    /**
     * Retrieves missions assigned to a specific Avenger.
     * @param avengerUser The Avenger user.
     * @return List of MissionDTOs for the given Avenger.
     */
    public List<MissionDTO> getMissionsForAvenger(User avengerUser) {
        return missionRepository.findMissionsByParticipantId(avengerUser.getId()).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    /**
     * Counts missions by a specific status.
     * @param status The mission status to count.
     * @return The count of missions with that status.
     */
    public long countMissionsByStatus(MissionStatus status) {
        return missionRepository.countByStatus(status);
    }

    /**
     * Counts active missions for a specific Avenger.
     * @param avengerUser The Avenger user.
     * @return The count of active missions for the Avenger.
     */
    public long countActiveMissionsForAvenger(User avengerUser) {
        return missionRepository.countActiveMissionsByParticipantId(avengerUser.getId());
    }

    /**
     * Counts completed missions for a specific Avenger.
     * @param avengerUser The Avenger user.
     * @return The count of completed missions for the Avenger.
     */
    public long countCompletedMissionsForAvenger(User avengerUser) {
        return missionRepository.countCompletedMissionsByParticipantId(avengerUser.getId());
    }

    /**
     * Converts a Mission entity to a MissionDTO.
     * @param mission The Mission entity.
     * @return The corresponding MissionDTO.
     */
    private MissionDTO convertToDto(Mission mission) {
        MissionDTO dto = new MissionDTO();
        dto.setId(mission.getId());
        dto.setMissionName(mission.getMissionName());
        dto.setDescription(mission.getDescription());
        dto.setStatus(mission.getStatus());
        dto.setAssignedByUsername(mission.getAssignedBy().getUsername());
        dto.setCreatedAt(mission.getCreatedAt());
        dto.setUpdatedAt(mission.getUpdatedAt());

        // Fetch participants for this mission
        List<MissionParticipant> participants = missionParticipantRepository.findByMissionId(mission.getId());
        List<UserDTO> participantDTOs = participants.stream()
                .map(mp -> {
                    User user = mp.getUser();
                    return new UserDTO(user.getId(), user.getUsername(), user.getEmail(), user.getRole(), user.getBalance(), user.getAlive());
                })
                .collect(Collectors.toList());
        dto.setParticipants(participantDTOs);

        return dto;
    }
}
