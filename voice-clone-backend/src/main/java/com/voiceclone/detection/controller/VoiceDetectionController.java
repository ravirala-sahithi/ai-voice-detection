package com.voiceclone.detection.controller;

import com.voiceclone.detection.dto.AnalysisResponse;
import com.voiceclone.detection.dto.DashboardStatsDto;
import com.voiceclone.detection.service.VoiceDetectionService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/voice")
public class VoiceDetectionController {

    private final VoiceDetectionService voiceDetectionService;

    public VoiceDetectionController(VoiceDetectionService voiceDetectionService) {
        this.voiceDetectionService = voiceDetectionService;
    }

    @PostMapping("/analyze")
    public ResponseEntity<AnalysisResponse> analyzeAudio(
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        AnalysisResponse response = voiceDetectionService.analyzeAndSave(file, userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/result/{id}")
    public ResponseEntity<AnalysisResponse> getResultById(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        AnalysisResponse response = voiceDetectionService.getResultById(id, userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/history")
    public ResponseEntity<List<AnalysisResponse>> getHistory(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        List<AnalysisResponse> history = voiceDetectionService.getUserHistory(userDetails.getUsername());
        return ResponseEntity.ok(history);
    }

    @DeleteMapping("/history/{id}")
    public ResponseEntity<Map<String, String>> deleteResult(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        voiceDetectionService.deleteResult(id, userDetails.getUsername());
        return ResponseEntity.ok(Map.of("message", "Analysis record deleted successfully."));
    }

    @GetMapping("/dashboard")
    public ResponseEntity<DashboardStatsDto> getDashboardStats(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        DashboardStatsDto stats = voiceDetectionService.getDashboardStats(userDetails.getUsername());
        return ResponseEntity.ok(stats);
    }
}
