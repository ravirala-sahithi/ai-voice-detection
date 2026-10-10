-- AI Voice Clone Detection System
-- TiDB Cloud Database Schema
-- Database Name: voice_clone_detection

CREATE DATABASE IF NOT EXISTS `voice_clone_detection`
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `voice_clone_detection`;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS `users` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL,
    `email` VARCHAR(150) NOT NULL UNIQUE,
    `password_hash` VARCHAR(255) NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Audio Analysis Results Table
CREATE TABLE IF NOT EXISTS `analysis_results` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `user_id` BIGINT NOT NULL,
    `original_filename` VARCHAR(255) NOT NULL,
    `prediction` VARCHAR(50) NOT NULL,
    `real_probability` DOUBLE NOT NULL,
    `ai_generated_probability` DOUBLE NOT NULL,
    `confidence_percent` DOUBLE NOT NULL,
    `analyzed_duration_seconds` DOUBLE NOT NULL,
    `model_name` VARCHAR(100) NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_analysis_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    INDEX `idx_analysis_user_id` (`user_id`),
    INDEX `idx_analysis_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
