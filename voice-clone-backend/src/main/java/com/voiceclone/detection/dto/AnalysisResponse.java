package com.voiceclone.detection.dto;

import java.time.LocalDateTime;

public class AnalysisResponse {

    private Long id;
    private String originalFilename;
    private String prediction;
    private Double realProbability;
    private Double aiGeneratedProbability;
    private Double confidencePercent;
    private Double analyzedDurationSeconds;
    private String modelName;
    private String notice;
    private LocalDateTime createdAt;

    public AnalysisResponse() {}

    public AnalysisResponse(Long id, String originalFilename, String prediction,
                            Double realProbability, Double aiGeneratedProbability,
                            Double confidencePercent, Double analyzedDurationSeconds,
                            String modelName, String notice, LocalDateTime createdAt) {
        this.id = id;
        this.originalFilename = originalFilename;
        this.prediction = prediction;
        this.realProbability = realProbability;
        this.aiGeneratedProbability = aiGeneratedProbability;
        this.confidencePercent = confidencePercent;
        this.analyzedDurationSeconds = analyzedDurationSeconds;
        this.modelName = modelName;
        this.notice = notice;
        this.createdAt = createdAt;
    }

    public static AnalysisResponseBuilder builder() {
        return new AnalysisResponseBuilder();
    }

    public static class AnalysisResponseBuilder {
        private Long id;
        private String originalFilename;
        private String prediction;
        private Double realProbability;
        private Double aiGeneratedProbability;
        private Double confidencePercent;
        private Double analyzedDurationSeconds;
        private String modelName;
        private String notice;
        private LocalDateTime createdAt;

        public AnalysisResponseBuilder id(Long id) { this.id = id; return this; }
        public AnalysisResponseBuilder originalFilename(String originalFilename) { this.originalFilename = originalFilename; return this; }
        public AnalysisResponseBuilder prediction(String prediction) { this.prediction = prediction; return this; }
        public AnalysisResponseBuilder realProbability(Double realProbability) { this.realProbability = realProbability; return this; }
        public AnalysisResponseBuilder aiGeneratedProbability(Double aiGeneratedProbability) { this.aiGeneratedProbability = aiGeneratedProbability; return this; }
        public AnalysisResponseBuilder confidencePercent(Double confidencePercent) { this.confidencePercent = confidencePercent; return this; }
        public AnalysisResponseBuilder analyzedDurationSeconds(Double analyzedDurationSeconds) { this.analyzedDurationSeconds = analyzedDurationSeconds; return this; }
        public AnalysisResponseBuilder modelName(String modelName) { this.modelName = modelName; return this; }
        public AnalysisResponseBuilder notice(String notice) { this.notice = notice; return this; }
        public AnalysisResponseBuilder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }

        public AnalysisResponse build() {
            return new AnalysisResponse(id, originalFilename, prediction, realProbability,
                    aiGeneratedProbability, confidencePercent, analyzedDurationSeconds, modelName, notice, createdAt);
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

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

    public String getNotice() { return notice; }
    public void setNotice(String notice) { this.notice = notice; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
