package com.voiceclone.detection.dto;

import java.util.List;

public class DashboardStatsDto {
    private String userName;
    private long totalAnalyzed;
    private long likelyRealCount;
    private long aiGeneratedCount;
    private long inconclusiveCount;
    private List<AnalysisResponse> recentAnalyses;

    public DashboardStatsDto() {}

    public DashboardStatsDto(String userName, long totalAnalyzed, long likelyRealCount,
                             long aiGeneratedCount, long inconclusiveCount, List<AnalysisResponse> recentAnalyses) {
        this.userName = userName;
        this.totalAnalyzed = totalAnalyzed;
        this.likelyRealCount = likelyRealCount;
        this.aiGeneratedCount = aiGeneratedCount;
        this.inconclusiveCount = inconclusiveCount;
        this.recentAnalyses = recentAnalyses;
    }

    public static DashboardStatsDtoBuilder builder() {
        return new DashboardStatsDtoBuilder();
    }

    public static class DashboardStatsDtoBuilder {
        private String userName;
        private long totalAnalyzed;
        private long likelyRealCount;
        private long aiGeneratedCount;
        private long inconclusiveCount;
        private List<AnalysisResponse> recentAnalyses;

        public DashboardStatsDtoBuilder userName(String userName) { this.userName = userName; return this; }
        public DashboardStatsDtoBuilder totalAnalyzed(long totalAnalyzed) { this.totalAnalyzed = totalAnalyzed; return this; }
        public DashboardStatsDtoBuilder likelyRealCount(long likelyRealCount) { this.likelyRealCount = likelyRealCount; return this; }
        public DashboardStatsDtoBuilder aiGeneratedCount(long aiGeneratedCount) { this.aiGeneratedCount = aiGeneratedCount; return this; }
        public DashboardStatsDtoBuilder inconclusiveCount(long inconclusiveCount) { this.inconclusiveCount = inconclusiveCount; return this; }
        public DashboardStatsDtoBuilder recentAnalyses(List<AnalysisResponse> recentAnalyses) { this.recentAnalyses = recentAnalyses; return this; }

        public DashboardStatsDto build() {
            return new DashboardStatsDto(userName, totalAnalyzed, likelyRealCount, aiGeneratedCount, inconclusiveCount, recentAnalyses);
        }
    }

    public String getUserName() { return userName; }
    public void setUserName(String userName) { this.userName = userName; }

    public long getTotalAnalyzed() { return totalAnalyzed; }
    public void setTotalAnalyzed(long totalAnalyzed) { this.totalAnalyzed = totalAnalyzed; }

    public long getLikelyRealCount() { return likelyRealCount; }
    public void setLikelyRealCount(long likelyRealCount) { this.likelyRealCount = likelyRealCount; }

    public long getAiGeneratedCount() { return aiGeneratedCount; }
    public void setAiGeneratedCount(long aiGeneratedCount) { this.aiGeneratedCount = aiGeneratedCount; }

    public long getInconclusiveCount() { return inconclusiveCount; }
    public void setInconclusiveCount(long inconclusiveCount) { this.inconclusiveCount = inconclusiveCount; }

    public List<AnalysisResponse> getRecentAnalyses() { return recentAnalyses; }
    public void setRecentAnalyses(List<AnalysisResponse> recentAnalyses) { this.recentAnalyses = recentAnalyses; }
}
