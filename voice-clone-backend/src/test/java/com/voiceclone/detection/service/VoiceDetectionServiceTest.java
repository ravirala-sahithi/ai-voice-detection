package com.voiceclone.detection.service;

import com.voiceclone.detection.dto.AiServiceResponse;
import com.voiceclone.detection.dto.AnalysisResponse;
import com.voiceclone.detection.dto.DashboardStatsDto;
import com.voiceclone.detection.entity.AnalysisResult;
import com.voiceclone.detection.entity.User;
import com.voiceclone.detection.exception.ResourceNotFoundException;
import com.voiceclone.detection.repository.AnalysisResultRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class VoiceDetectionServiceTest {

    @Mock
    private AiClientService aiClientService;

    @Mock
    private AnalysisResultRepository analysisResultRepository;

    @Mock
    private AuthService authService;

    @InjectMocks
    private VoiceDetectionService voiceDetectionService;

    private User user1;
    private User user2;
    private AnalysisResult sampleResult;

    @BeforeEach
    void setUp() {
        user1 = User.builder().id(1L).name("User One").email("user1@example.com").build();
        user2 = User.builder().id(2L).name("User Two").email("user2@example.com").build();

        sampleResult = AnalysisResult.builder()
                .id(101L)
                .user(user1)
                .originalFilename("test_voice.wav")
                .prediction("AI_GENERATED")
                .realProbability(0.08)
                .aiGeneratedProbability(0.92)
                .confidencePercent(92.0)
                .analyzedDurationSeconds(4.5)
                .modelName("garystafford/wav2vec2-deepfake-voice-detector")
                .createdAt(LocalDateTime.now())
                .build();
    }

    @Test
    @DisplayName("Should successfully analyze audio and save result to database")
    void testAnalyzeAndSaveSuccess() {
        MockMultipartFile audioFile = new MockMultipartFile(
                "file",
                "test_voice.wav",
                "audio/wav",
                "RIFFmockwavdata".getBytes()
        );

        AiServiceResponse aiResponse = AiServiceResponse.builder()
                .prediction("AI_GENERATED")
                .realProbability(0.08)
                .aiGeneratedProbability(0.92)
                .confidencePercent(92.0)
                .analyzedDurationSeconds(4.5)
                .model("garystafford/wav2vec2-deepfake-voice-detector")
                .notice("Experimental prediction")
                .build();

        when(authService.getCurrentUserEntity("user1@example.com")).thenReturn(user1);
        when(aiClientService.analyzeAudio(audioFile)).thenReturn(aiResponse);
        when(analysisResultRepository.save(any(AnalysisResult.class))).thenReturn(sampleResult);

        AnalysisResponse response = voiceDetectionService.analyzeAndSave(audioFile, "user1@example.com");

        assertNotNull(response);
        assertEquals("AI_GENERATED", response.getPrediction());
        assertEquals(92.0, response.getConfidencePercent());
        assertEquals("test_voice.wav", response.getOriginalFilename());
        verify(analysisResultRepository, times(1)).save(any(AnalysisResult.class));
    }

    @Test
    @DisplayName("Should enforce user isolation: User 2 cannot access User 1 result")
    void testUserIsolationEnforced() {
        when(authService.getCurrentUserEntity("user2@example.com")).thenReturn(user2);
        // Repository returns empty when searching for result 101 with user 2's ID
        when(analysisResultRepository.findByIdAndUserId(101L, 2L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () ->
                voiceDetectionService.getResultById(101L, "user2@example.com")
        );
    }

    @Test
    @DisplayName("Should return accurate dashboard statistics for user")
    void testDashboardStats() {
        when(authService.getCurrentUserEntity("user1@example.com")).thenReturn(user1);
        when(analysisResultRepository.countByUserId(1L)).thenReturn(10L);
        when(analysisResultRepository.countByUserIdAndPrediction(1L, "LIKELY_REAL")).thenReturn(6L);
        when(analysisResultRepository.countByUserIdAndPrediction(1L, "AI_GENERATED")).thenReturn(3L);
        when(analysisResultRepository.countByUserIdAndPrediction(1L, "INCONCLUSIVE")).thenReturn(1L);
        when(analysisResultRepository.findTop10ByUserIdOrderByCreatedAtDesc(1L)).thenReturn(List.of(sampleResult));

        DashboardStatsDto stats = voiceDetectionService.getDashboardStats("user1@example.com");

        assertNotNull(stats);
        assertEquals(10L, stats.getTotalAnalyzed());
        assertEquals(6L, stats.getLikelyRealCount());
        assertEquals(3L, stats.getAiGeneratedCount());
        assertEquals(1L, stats.getInconclusiveCount());
        assertEquals(1, stats.getRecentAnalyses().size());
        assertEquals("User One", stats.getUserName());
    }
}
