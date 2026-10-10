package com.voiceclone.detection.repository;

import com.voiceclone.detection.entity.AnalysisResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AnalysisResultRepository extends JpaRepository<AnalysisResult, Long> {

    List<AnalysisResult> findByUserIdOrderByCreatedAtDesc(Long userId);

    Optional<AnalysisResult> findByIdAndUserId(Long id, Long userId);

    long countByUserId(Long userId);

    long countByUserIdAndPrediction(Long userId, String prediction);

    List<AnalysisResult> findTop10ByUserIdOrderByCreatedAtDesc(Long userId);

    void deleteByIdAndUserId(Long id, Long userId);
}
