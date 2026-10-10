package com.voiceclone.detection.service;

import com.voiceclone.detection.dto.AiServiceResponse;
import com.voiceclone.detection.dto.AnalysisResponse;
import com.voiceclone.detection.dto.DashboardStatsDto;
import com.voiceclone.detection.entity.AnalysisResult;
import com.voiceclone.detection.entity.User;
import com.voiceclone.detection.exception.ResourceNotFoundException;
import com.voiceclone.detection.repository.AnalysisResultRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Service
public class VoiceDetectionService {

    private final AiClientService aiClientService;
    private final AnalysisResultRepository analysisResultRepository;
    private final AuthService authService;

    public VoiceDetectionService(AiClientService aiClientService,
                                 AnalysisResultRepository analysisResultRepository,
                                 AuthService authService) {
        this.aiClientService = aiClientService;
        this.analysisResultRepository = analysisResultRepository;
        this.authService = authService;
    }

    @Transactional
    public AnalysisResponse analyzeAndSave(MultipartFile file, String userEmail) {
        User user = authService.getCurrentUserEntity(userEmail);

        // Forward to AI service for deepfake detection
        AiServiceResponse aiResponse = aiClientService.analyzeAudio(file);

        String originalFilename = file.getOriginalFilename() != null ? file.getOriginalFilename() : "audio_recording.wav";

        // Persist to TiDB database
        AnalysisResult result = AnalysisResult.builder()
                .user(user)
                .originalFilename(originalFilename)
                .prediction(aiResponse.getPrediction())
                .realProbability(aiResponse.getRealProbability())
                .aiGeneratedProbability(aiResponse.getAiGeneratedProbability())
                .confidencePercent(aiResponse.getConfidencePercent())
                .analyzedDurationSeconds(aiResponse.getAnalyzedDurationSeconds())
                .modelName(aiResponse.getModel())
                .build();

        AnalysisResult savedResult = analysisResultRepository.save(result);

        return mapToAnalysisResponse(savedResult, aiResponse.getNotice());
    }

    @Transactional(readOnly = true)
    public AnalysisResponse getResultById(Long id, String userEmail) {
        User user = authService.getCurrentUserEntity(userEmail);
        AnalysisResult result = analysisResultRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Analysis record not found or you do not have permission to access it."));

        return mapToAnalysisResponse(result, "Experimental prediction, not proof of authenticity.");
    }

    @Transactional(readOnly = true)
    public List<AnalysisResponse> getUserHistory(String userEmail) {
        User user = authService.getCurrentUserEntity(userEmail);
        return analysisResultRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(r -> mapToAnalysisResponse(r, "Experimental prediction, not proof of authenticity."))
                .toList();
    }

    @Transactional
    public void deleteResult(Long id, String userEmail) {
        User user = authService.getCurrentUserEntity(userEmail);
        AnalysisResult result = analysisResultRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Analysis record not found or you do not have permission to delete it."));

        analysisResultRepository.delete(result);
    }

    @Transactional(readOnly = true)
    public DashboardStatsDto getDashboardStats(String userEmail) {
        User user = authService.getCurrentUserEntity(userEmail);
        Long userId = user.getId();

        long total = analysisResultRepository.countByUserId(userId);
        long likelyReal = analysisResultRepository.countByUserIdAndPrediction(userId, "LIKELY_REAL");
        long aiGenerated = analysisResultRepository.countByUserIdAndPrediction(userId, "AI_GENERATED");
        long inconclusive = analysisResultRepository.countByUserIdAndPrediction(userId, "INCONCLUSIVE");

        List<AnalysisResponse> recent = analysisResultRepository.findTop10ByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(r -> mapToAnalysisResponse(r, "Experimental prediction, not proof of authenticity."))
                .toList();

        return DashboardStatsDto.builder()
                .userName(user.getName())
                .totalAnalyzed(total)
                .likelyRealCount(likelyReal)
                .aiGeneratedCount(aiGenerated)
                .inconclusiveCount(inconclusive)
                .recentAnalyses(recent)
                .build();
    }

    private AnalysisResponse mapToAnalysisResponse(AnalysisResult entity, String notice) {
        return AnalysisResponse.builder()
                .id(entity.getId())
                .originalFilename(entity.getOriginalFilename())
                .prediction(entity.getPrediction())
                .realProbability(entity.getRealProbability())
                .aiGeneratedProbability(entity.getAiGeneratedProbability())
                .confidencePercent(entity.getConfidencePercent())
                .analyzedDurationSeconds(entity.getAnalyzedDurationSeconds())
                .modelName(entity.getModelName())
                .notice(notice)
                .createdAt(entity.getCreatedAt())
                .build();
    }
}
