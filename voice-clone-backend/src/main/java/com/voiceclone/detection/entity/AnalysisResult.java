package com.voiceclone.detection.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "analysis_results")
public class AnalysisResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "original_filename", nullable = false)
    private String originalFilename;

    @Column(nullable = false, length = 50)
    private String prediction;

    @Column(name = "real_probability", nullable = false)
    private Double realProbability;

    @Column(name = "ai_generated_probability", nullable = false)
    private Double aiGeneratedProbability;

    @Column(name = "confidence_percent", nullable = false)
    private Double confidencePercent;

    @Column(name = "analyzed_duration_seconds", nullable = false)
    private Double analyzedDurationSeconds;

    @Column(name = "model_name", nullable = false, length = 100)
    private String modelName;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public AnalysisResult() {}

    public AnalysisResult(Long id, User user, String originalFilename, String prediction,
                          Double realProbability, Double aiGeneratedProbability,
                          Double confidencePercent, Double analyzedDurationSeconds,
                          String modelName, LocalDateTime createdAt) {
        this.id = id;
        this.user = user;
        this.originalFilename = originalFilename;
        this.prediction = prediction;
        this.realProbability = realProbability;
        this.aiGeneratedProbability = aiGeneratedProbability;
        this.confidencePercent = confidencePercent;
        this.analyzedDurationSeconds = analyzedDurationSeconds;
        this.modelName = modelName;
        this.createdAt = createdAt;
    }

    public static AnalysisResultBuilder builder() {
        return new AnalysisResultBuilder();
    }

    public static class AnalysisResultBuilder {
        private Long id;
        private User user;
        private String originalFilename;
        private String prediction;
        private Double realProbability;
        private Double aiGeneratedProbability;
        private Double confidencePercent;
        private Double analyzedDurationSeconds;
        private String modelName;
        private LocalDateTime createdAt;

        public AnalysisResultBuilder id(Long id) { this.id = id; return this; }
        public AnalysisResultBuilder user(User user) { this.user = user; return this; }
        public AnalysisResultBuilder originalFilename(String originalFilename) { this.originalFilename = originalFilename; return this; }
        public AnalysisResultBuilder prediction(String prediction) { this.prediction = prediction; return this; }
        public AnalysisResultBuilder realProbability(Double realProbability) { this.realProbability = realProbability; return this; }
        public AnalysisResultBuilder aiGeneratedProbability(Double aiGeneratedProbability) { this.aiGeneratedProbability = aiGeneratedProbability; return this; }
        public AnalysisResultBuilder confidencePercent(Double confidencePercent) { this.confidencePercent = confidencePercent; return this; }
        public AnalysisResultBuilder analyzedDurationSeconds(Double analyzedDurationSeconds) { this.analyzedDurationSeconds = analyzedDurationSeconds; return this; }
        public AnalysisResultBuilder modelName(String modelName) { this.modelName = modelName; return this; }
        public AnalysisResultBuilder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }

        public AnalysisResult build() {
            return new AnalysisResult(id, user, originalFilename, prediction, realProbability,
                    aiGeneratedProbability, confidencePercent, analyzedDurationSeconds, modelName, createdAt);
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public String getOriginalFilename() { return originalFilename; }
    public void setOriginalFilename(String originalFilename) { this.originalFilename = originalFilename; }

    public String getPrediction() { return prediction; }
    public void setPrediction(String prediction) { this.prediction = prediction; }

    public Double getRealProbability() { return realProbability; }
    public void setRealProbability(Double realProbability) { this.realProbability = realProbability; }

    public Double getAiGeneratedProbability() { return aiGeneratedProbability; }
    public void setAiGeneratedProbability(Double aiGeneratedProbability) { this.aiGeneratedProbability = aiGeneratedProbability; }

    public Double getConfidencePercent() { return confidencePercent; }
    public void setConfidencePercent(Double confidencePercent) { this.confidencePercent = confidencePercent; }

    public Double getAnalyzedDurationSeconds() { return analyzedDurationSeconds; }
    public void setAnalyzedDurationSeconds(Double analyzedDurationSeconds) { this.analyzedDurationSeconds = analyzedDurationSeconds; }

    public String getModelName() { return modelName; }
    public void setModelName(String modelName) { this.modelName = modelName; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
