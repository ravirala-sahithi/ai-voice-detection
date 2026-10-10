package com.voiceclone.detection.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.Map;

@RestController
public class RootController {

    @GetMapping({"/", "/api"})
    public ResponseEntity<Map<String, Object>> getApiStatus() {
        return ResponseEntity.ok(Map.of(
                "status", "UP",
                "service", "VoiceGuard AI Backend Gateway",
                "version", "1.0.0",
                "timestamp", LocalDateTime.now().toString(),
                "endpoints", Map.of(
                        "authRegister", "POST /api/auth/register",
                        "authLogin", "POST /api/auth/login",
                        "analyzeAudio", "POST /api/voice/analyze",
                        "dashboard", "GET /api/voice/dashboard",
                        "history", "GET /api/voice/history"
                )
        ));
    }
}
