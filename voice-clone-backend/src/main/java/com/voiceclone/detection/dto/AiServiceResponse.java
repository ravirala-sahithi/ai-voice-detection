package com.voiceclone.detection.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class AiServiceResponse {

    private String prediction;

    @JsonProperty("real_probability")
    private Double realProbability;

    @JsonProperty("ai_generated_probability")
    private Double aiGeneratedProbability;

    @JsonProperty("confidence_percent")
    private Double confidencePercent;

    @JsonProperty("analyzed_duration_seconds")
    private Double analyzedDurationSeconds;

    private String model;
    private String notice;

    public AiServiceResponse() {}

    public AiServiceResponse(String prediction, Double realProbability, Double aiGeneratedProbability,
                             Double confidencePercent, Double analyzedDurationSeconds, String model, String notice) {
        this.prediction = prediction;
        this.realProbability = realProbability;
        this.aiGeneratedProbability = aiGeneratedProbability;
        this.confidencePercent = confidencePercent;
        this.analyzedDurationSeconds = analyzedDurationSeconds;
        this.model = model;
        this.notice = notice;
    }

    public static AiServiceResponseBuilder builder() {
        return new AiServiceResponseBuilder();
    }

    public static class AiServiceResponseBuilder {
        private String prediction;
        private Double realProbability;
        private Double aiGeneratedProbability;
        private Double confidencePercent;
        private Double analyzedDurationSeconds;
        private String model;
        private String notice;

        public AiServiceResponseBuilder prediction(String prediction) { this.prediction = prediction; return this; }
        public AiServiceResponseBuilder realProbability(Double realProbability) { this.realProbability = realProbability; return this; }
        public AiServiceResponseBuilder aiGeneratedProbability(Double aiGeneratedProbability) { this.aiGeneratedProbability = aiGeneratedProbability; return this; }
        public AiServiceResponseBuilder confidencePercent(Double confidencePercent) { this.confidencePercent = confidencePercent; return this; }
        public AiServiceResponseBuilder analyzedDurationSeconds(Double analyzedDurationSeconds) { this.analyzedDurationSeconds = analyzedDurationSeconds; return this; }
        public AiServiceResponseBuilder model(String model) { this.model = model; return this; }
        public AiServiceResponseBuilder notice(String notice) { this.notice = notice; return this; }

        public AiServiceResponse build() {
            return new AiServiceResponse(prediction, realProbability, aiGeneratedProbability,
                    confidencePercent, analyzedDurationSeconds, model, notice);
        }
    }

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

    public String getModel() { return model; }
    public void setModel(String model) { this.model = model; }

    public String getNotice() { return notice; }
    public void setNotice(String notice) { this.notice = notice; }
}
