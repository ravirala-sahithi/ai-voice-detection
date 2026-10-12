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

    private final RestTemplate restTemplate;
    private final String aiServiceUrl;

    public AiClientService(
            @Value("${ai.service.url:http://127.0.0.1:8000}") String aiServiceUrl,
            @Value("${ai.service.connect-timeout-ms:10000}") int connectTimeout,
            @Value("${ai.service.read-timeout-ms:60000}") int readTimeout
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

        try {
            byte[] fileBytes = file.getBytes();

            ByteArrayResource fileResource = new ByteArrayResource(fileBytes) {
                @Override
                public String getFilename() {
                    return originalFilename;
                }
            };

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("file", fileResource);

            HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

            logger.info("Forwarding audio '{}' ({} bytes) to AI service: {}", originalFilename, fileBytes.length, detectEndpoint);

            ResponseEntity<AiServiceResponse> response = restTemplate.postForEntity(
                    detectEndpoint,
                    requestEntity,
                    AiServiceResponse.class
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return response.getBody();
            } else {
                throw new AiServiceException("Unexpected response received from AI service: " + response.getStatusCode());
            }

        } catch (HttpClientErrorException ex) {
            logger.warn("AI service returned 4xx status: {} - {}", ex.getStatusCode(), ex.getResponseBodyAsString());
            if (ex.getStatusCode() == HttpStatus.PAYLOAD_TOO_LARGE) {
                throw new BadRequestException("Uploaded file exceeds the maximum allowed size.");
            }
            throw new BadRequestException("AI Service rejected the audio: " + ex.getResponseBodyAsString());

        } catch (HttpServerErrorException ex) {
            String rawBody = ex.getResponseBodyAsString();
            String cleanMsg = sanitizeErrorBody(rawBody);
            logger.error("AI service server error ({}): {}", ex.getStatusCode(), rawBody);
            throw new AiServiceException("AI service error during inference: " + cleanMsg);

        } catch (ResourceAccessException ex) {
            logger.error("Failed to connect to AI service at {}: {}", detectEndpoint, ex.getMessage());
            throw new AiServiceException("AI service is currently unavailable. Please verify that the Python FastAPI server is running on port 8000.", ex);

        } catch (IOException ex) {
            logger.error("Error reading uploaded file: {}", ex.getMessage());
            throw new BadRequestException("Could not read uploaded audio file: " + ex.getMessage());
        }
    }

    /**
     * Strips HTML tags from an error response body and truncates to a safe length.
     * Prevents raw 502/503 HTML pages returned by proxies/gateways from leaking
     * into user-facing error messages.
     */
    private String sanitizeErrorBody(String rawBody) {
        if (rawBody == null || rawBody.isBlank()) {
            return "No details available from AI service.";
        }
        // Check if the response looks like HTML (starts with <!DOCTYPE or <html)
        String trimmed = rawBody.trim();
        if (trimmed.startsWith("<")) {
            // It's HTML — extract only the text between <title> if present, else generic message
            int titleStart = trimmed.toLowerCase().indexOf("<title>");
            int titleEnd   = trimmed.toLowerCase().indexOf("</title>");
            if (titleStart != -1 && titleEnd != -1 && titleEnd > titleStart) {
                String title = trimmed.substring(titleStart + 7, titleEnd).trim();
                return "AI service returned HTTP error: " + title + ". The service may be starting up — please retry in a moment.";
            }
            return "AI service is temporarily unavailable (gateway error). Please retry in 30–60 seconds.";
        }
        // Not HTML — just truncate to 200 chars
        return trimmed.length() > 200 ? trimmed.substring(0, 200) + "…" : trimmed;
    }
}
