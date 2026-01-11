FROM maven:3.9-eclipse-temurin-21 AS development
WORKDIR /app
COPY pom.xml .
COPY src ./src
ENTRYPOINT ["mvn", "spring-boot:run"]

FROM maven:3.9-eclipse-temurin-21 AS build

WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

FROM eclipse-temurin:21-jre-alpine AS production
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "--enable-preview", "-jar", "app.jar"]
