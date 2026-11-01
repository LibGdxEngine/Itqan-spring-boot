FROM maven:3.9-eclipse-temurin-21 AS development
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -B
COPY src ./src
EXPOSE 8080
ENTRYPOINT ["mvn", "spring-boot:run", "-Dspring-boot.run.jvmArguments=-Dspring.devtools.restart.pollInterval=2000 -Dspring.devtools.restart.quietPeriod=1000"]

FROM maven:3.9-eclipse-temurin-21 AS build

WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

FROM eclipse-temurin:24-jre-alpine AS production
WORKDIR /app
# curl is required by the container healthcheck and scripts/deploy.sh readiness probe.
RUN apk add --no-cache curl
COPY --from=build /app/target/*.jar app.jar
# Run as an unprivileged user; logs go to /app/logs (LOG_PATH), so it must be writable.
RUN addgroup -S app && adduser -S app -G app && mkdir -p /app/logs && chown -R app:app /app
USER app
EXPOSE 8080
ENTRYPOINT ["java", "--enable-preview", "-jar", "app.jar"]
