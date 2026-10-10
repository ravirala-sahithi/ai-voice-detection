package com.voiceclone.detection.service;

import com.voiceclone.detection.dto.AuthRequest;
import com.voiceclone.detection.dto.AuthResponse;
import com.voiceclone.detection.dto.RegisterRequest;
import com.voiceclone.detection.entity.User;
import com.voiceclone.detection.exception.BadRequestException;
import com.voiceclone.detection.repository.UserRepository;
import com.voiceclone.detection.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private UserDetailsService userDetailsService;

    @InjectMocks
    private AuthService authService;

    private User sampleUser;

    @BeforeEach
    void setUp() {
        sampleUser = User.builder()
                .id(1L)
                .name("Alex Johnson")
                .email("alex@example.com")
                .passwordHash("hashedPassword123")
                .createdAt(LocalDateTime.now())
                .build();
    }

    @Test
    @DisplayName("Should successfully register a new user and return JWT token")
    void testRegisterSuccess() {
        RegisterRequest request = RegisterRequest.builder()
                .name("Alex Johnson")
                .email("alex@example.com")
                .password("Secret@123")
                .build();

        when(userRepository.existsByEmail("alex@example.com")).thenReturn(false);
        when(passwordEncoder.encode("Secret@123")).thenReturn("hashedPassword123");
        when(userRepository.save(any(User.class))).thenReturn(sampleUser);

        UserDetails userDetails = org.springframework.security.core.userdetails.User
                .withUsername("alex@example.com")
                .password("hashedPassword123")
                .authorities("ROLE_USER")
                .build();
        when(userDetailsService.loadUserByUsername("alex@example.com")).thenReturn(userDetails);
        when(jwtService.generateToken(userDetails, 1L, "Alex Johnson")).thenReturn("mock.jwt.token");

        AuthResponse response = authService.register(request);

        assertNotNull(response);
        assertEquals("mock.jwt.token", response.getToken());
        assertEquals("Bearer", response.getType());
        assertEquals("Alex Johnson", response.getUser().getName());
        assertEquals("alex@example.com", response.getUser().getEmail());

        verify(userRepository, times(1)).save(any(User.class));
        verify(passwordEncoder, times(1)).encode("Secret@123");
    }

    @Test
    @DisplayName("Should throw BadRequestException if registering with existing email")
    void testRegisterDuplicateEmail() {
        RegisterRequest request = RegisterRequest.builder()
                .name("Alex Johnson")
                .email("alex@example.com")
                .password("Secret@123")
                .build();

        when(userRepository.existsByEmail("alex@example.com")).thenReturn(true);

        assertThrows(BadRequestException.class, () -> authService.register(request));
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("Should successfully login user and return JWT token")
    void testLoginSuccess() {
        AuthRequest request = AuthRequest.builder()
                .email("alex@example.com")
                .password("Secret@123")
                .build();

        when(userRepository.findByEmail("alex@example.com")).thenReturn(Optional.of(sampleUser));

        UserDetails userDetails = org.springframework.security.core.userdetails.User
                .withUsername("alex@example.com")
                .password("hashedPassword123")
                .authorities("ROLE_USER")
                .build();
        when(userDetailsService.loadUserByUsername("alex@example.com")).thenReturn(userDetails);
        when(jwtService.generateToken(userDetails, 1L, "Alex Johnson")).thenReturn("login.jwt.token");

        AuthResponse response = authService.login(request);

        assertNotNull(response);
        assertEquals("login.jwt.token", response.getToken());
        assertEquals("alex@example.com", response.getUser().getEmail());
        verify(authenticationManager, times(1)).authenticate(any());
    }
}
