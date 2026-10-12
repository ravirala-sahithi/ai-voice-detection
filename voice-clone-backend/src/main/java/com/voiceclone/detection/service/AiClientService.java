package com.voiceclone.detection.service;

import com.voiceclone.detection.dto.AiServiceResponse;
import com.voiceclone.detection.exception.AiServiceException;
import com.voiceclone.detection.exception.BadRequestException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@Service
public class AiClientService {

    private static final Logger logger = LoggerFactory.getLogger(AiClientService.class);

    // Max number of attempts (1 initial + 2 retries) for transient 502/503 errors
    private static final int MAX_ATTEMPTS = 3;
    // Delay in ms between retries (5 seconds — gives Render time to wake up)
    private static final long RETRY_DELAY_MS = 5000;

    private final RestTemplate restTemplate;
    private final String aiServiceUrl;

    public AiClientService(
            @Value("${ai.service.url:http://127.0.0.1:8000}") String aiServiceUrl,
            @Value("${ai.service.connect-timeout-ms:15000}") int connectTimeout,
            @Value("${ai.service.read-timeout-ms:120000}") int readTimeout
    ) {
        this.aiServiceUrl = aiServiceUrl.replaceAll("/+$", "");
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(connectTimeout);
        factory.setReadTimeout(readTimeout);
        this.restTemplate = new RestTemplate(factory);
    }

    public AiServiceResponse analyzeAudio(MultipartFile file) {
        if (file.isEmpty()) {
            throw new BadRequestException("Uploaded audio file is empty.");
        }

        String originalFilename = file.getOriginalFilename() != null ? file.getOriginalFilename() : "audio.wav";
        String detectEndpoint = aiServiceUrl + "/detect";

        byte[] fileBytes;
        try {
            fileBytes = file.getBytes();
        } catch (IOException ex) {
            logger.error("Error reading uploaded file: {}", ex.getMessage());
            throw new BadRequestException("Could not read uploaded audio file: " + ex.getMessage());
        }

        // Retry loop — handles transient 502/503 from Render cold-starts
        Exception lastException = null;
        for (int attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
            try {
                if (attempt > 1) {
                    logger.info("Retrying AI service call (attempt {}/{}) after {}ms delay...",
                            attempt, MAX_ATTEMPTS, RETRY_DELAY_MS);
                    Thread.sleep(RETRY_DELAY_MS);
                }

                AiServiceResponse result = callAiService(fileBytes, originalFilename, detectEndpoint);
                if (attempt > 1) {
                    logger.info("AI service call succeeded on attempt {}", attempt);
                }
                return result;

            } catch (AiServiceException ex) {
                lastException = ex;
                // Only retry on gateway errors (502/503 — service waking up)
                if (isRetryableError(ex)) {
                    logger.warn("AI service returned a gateway error on attempt {}/{}: {}",
                            attempt, MAX_ATTEMPTS, ex.getMessage());
                } else {
                    // Non-retryable error — fail immediately
                    throw ex;
                }
            } catch (InterruptedException ie) {
                Thread.currentThread().interrupt();
                throw new AiServiceException("Request interrupted while waiting to retry AI service.");
            }
        }

        // All retries exhausted
        logger.error("AI service failed after {} attempts. Last error: {}", MAX_ATTEMPTS,
                lastException != null ? lastException.getMessage() : "unknown");
        throw new AiServiceException(
                "The AI detection service is currently starting up. Please wait 30–60 seconds and try again.",
                lastException
        );
    }

    /**
     * Makes a single attempt to call the AI service /detect endpoint.
     */
    private AiServiceResponse callAiService(byte[] fileBytes, String originalFilename, String detectEndpoint) {
        final String fname = originalFilename;
        ByteArrayResource fileResource = new ByteArrayResource(fileBytes) {
            @Override
            public String getFilename() {
                return fname;
            }
        };

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("file", fileResource);

        HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

        logger.info("Calling AI service: POST {} ({} bytes)", detectEndpoint, fileBytes.length);

        try {
            ResponseEntity<AiServiceResponse> response = restTemplate.postForEntity(
                    detectEndpoint,
                    requestEntity,
                    AiServiceResponse.class
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return response.getBody();
            } else {
                throw new AiServiceException("Unexpected response from AI service: " + response.getStatusCode());
            }

        } catch (HttpClientErrorException ex) {
            logger.warn("AI service returned 4xx status: {} - {}", ex.getStatusCode(), ex.getResponseBodyAsString());
            if (ex.getStatusCode() == HttpStatus.PAYLOAD_TOO_LARGE) {
                throw new BadRequestException("Uploaded file exceeds the maximum allowed size.");
            }
            throw new BadRequestException("AI service rejected the audio: " + ex.getResponseBodyAsString());

        } catch (HttpServerErrorException ex) {
            String rawBody = ex.getResponseBodyAsString();
            String cleanMsg = sanitizeErrorBody(rawBody);
            logger.error("AI service server error ({}): {}", ex.getStatusCode(), rawBody);
            // Mark as retryable by wrapping in AiServiceException with a sentinel prefix
            throw new AiServiceException("GATEWAY_ERROR:" + cleanMsg);

        } catch (ResourceAccessException ex) {
            logger.error("Could not connect to AI service at {}: {}", detectEndpoint, ex.getMessage());
            throw new AiServiceException(
                    "GATEWAY_ERROR:AI service is unreachable. It may be starting up — please try again in a moment."
            );
        }
    }

    /**
     * Returns true if the exception represents a transient gateway error worth retrying.
     */
    private boolean isRetryableError(AiServiceException ex) {
        return ex.getMessage() != null && ex.getMessage().startsWith("GATEWAY_ERROR:");
    }

    /**
     * Strips HTML tags from an error response body and truncates to a safe length.
     * Prevents raw 502/503 HTML pages returned by proxies/gateways from leaking
     * into user-facing error messages.
     */
    private String sanitizeErrorBody(String rawBody) {
        if (rawBody == null || rawBody.isBlank()) {
            return "AI service is temporarily unavailable. Please try again in a moment.";
        }
        String trimmed = rawBody.trim();
        if (trimmed.startsWith("<")) {
            // HTML page — extract <title> text for a concise message
            int titleStart = trimmed.toLowerCase().indexOf("<title>");
            int titleEnd   = trimmed.toLowerCase().indexOf("</title>");
            if (titleStart != -1 && titleEnd != -1 && titleEnd > titleStart) {
                String title = trimmed.substring(titleStart + 7, titleEnd).trim();
                return "AI service returned HTTP error: " + title + ". The service may be starting up.";
            }
            return "AI service is temporarily unavailable (gateway error).";
        }
        return trimmed.length() > 200 ? trimmed.substring(0, 200) + "…" : trimmed;
    }
}
