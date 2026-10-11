# =============================================================================
# VoiceGuard AI — Spring Boot Backend Dockerfile
# Multi-stage build: Maven compile → JRE-only runtime
# =============================================================================

# Stage 1: Build with Maven (no mvnw in repo, so use official Maven image)
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app

# Copy pom.xml first for dependency caching
COPY pom.xml .
RUN mvn dependency:resolve -B -q

# Copy source and build the fat JAR
COPY src ./src
RUN mvn package -DskipTests -B -q

# Stage 2: Lightweight JRE runtime
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app

# Copy only the executable JAR from build stage
COPY --from=build /app/target/*.jar app.jar

# Render injects PORT at runtime; Spring Boot reads it via ${PORT:8081}
# Memory settings sized for Render Starter (512 MB)
ENTRYPOINT ["java", \
  "-Xmx384m", \
  "-Xss512k", \
  "-XX:+UseSerialGC", \
  "-XX:MaxMetaspaceSize=128m", \
  "-Djava.security.egd=file:/dev/./urandom", \
  "-jar", "app.jar"]
