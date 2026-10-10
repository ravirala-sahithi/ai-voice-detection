package com.voiceclone.detection.service;

import com.voiceclone.detection.dto.AuthRequest;
import com.voiceclone.detection.dto.AuthResponse;
import com.voiceclone.detection.dto.RegisterRequest;
import com.voiceclone.detection.dto.UserDto;
import com.voiceclone.detection.entity.User;
import com.voiceclone.detection.exception.BadRequestException;
import com.voiceclone.detection.exception.ResourceNotFoundException;
import com.voiceclone.detection.repository.UserRepository;
import com.voiceclone.detection.security.JwtService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final UserDetailsService userDetailsService;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder,
                       JwtService jwtService, AuthenticationManager authenticationManager,
                       UserDetailsService userDetailsService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.authenticationManager = authenticationManager;
        this.userDetailsService = userDetailsService;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        validatePasswordStrength(request.getPassword());

        String normalizedEmail = request.getEmail().trim().toLowerCase();
        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new BadRequestException("An account with this email address already exists.");
        }

        User user = User.builder()
                .name(request.getName().trim())
                .email(normalizedEmail)
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .build();

        User savedUser = userRepository.save(user);

        UserDetails userDetails = userDetailsService.loadUserByUsername(savedUser.getEmail());
        String token = jwtService.generateToken(userDetails, savedUser.getId(), savedUser.getName());

        return AuthResponse.builder()
                .token(token)
                .type("Bearer")
                .user(mapToUserDto(savedUser))
                .build();
    }

    public AuthResponse login(AuthRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(normalizedEmail, request.getPassword())
        );

        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + normalizedEmail));

        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        String token = jwtService.generateToken(userDetails, user.getId(), user.getName());

        return AuthResponse.builder()
                .token(token)
                .type("Bearer")
                .user(mapToUserDto(user))
                .build();
    }

    public UserDto getCurrentUserDto(String email) {
        User user = getCurrentUserEntity(email);
        return mapToUserDto(user);
    }

    public User getCurrentUserEntity(String email) {
        return userRepository.findByEmail(email.trim().toLowerCase())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
    }

    private UserDto mapToUserDto(User user) {
        return UserDto.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .createdAt(user.getCreatedAt())
                .build();
    }

    private void validatePasswordStrength(String password) {
        if (password == null || password.length() < 8) {
            throw new BadRequestException("Password must be at least 8 characters long.");
        }
        if (!password.matches(".*[A-Z].*")) {
            throw new BadRequestException("Password must contain at least 1 uppercase letter.");
        }
        if (!password.matches(".*[a-z].*")) {
            throw new BadRequestException("Password must contain at least 1 lowercase letter.");
        }
        if (!password.matches(".*\\d.*")) {
            throw new BadRequestException("Password must contain at least 1 number.");
        }
        if (!password.matches(".*[^a-zA-Z0-9].*")) {
            throw new BadRequestException("Password must contain at least 1 special symbol.");
        }
    }
}
