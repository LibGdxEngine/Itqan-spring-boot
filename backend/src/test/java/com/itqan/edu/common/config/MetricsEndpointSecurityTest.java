package com.itqan.edu.common.config;

import com.itqan.edu.config.BaseIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.autoconfigure.actuate.observability.AutoConfigureObservability;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.TestPropertySource;

import static org.assertj.core.api.Assertions.assertThat;

// Spring Boot switches metrics exporters off in tests unless asked.
@AutoConfigureObservability
@TestPropertySource(properties = "app.metrics.scrape-token=test-scrape-token")
class MetricsEndpointSecurityTest extends BaseIntegrationTest {

    private ResponseEntity<String> scrape(String user, String password) {
        HttpHeaders headers = new HttpHeaders();
        if (user != null) {
            headers.setBasicAuth(user, password);
        }
        return restTemplate.exchange("/actuator/prometheus", HttpMethod.GET, new HttpEntity<>(headers), String.class);
    }

    @Test
    void scraperWithTokenReadsPrometheusMetrics() {
        ResponseEntity<String> response = scrape("prometheus", "test-scrape-token");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).contains("jvm_memory_used_bytes");
    }

    @Test
    void anonymousAndWrongTokenAreRejected() {
        assertThat(scrape(null, null).getStatusCode().value()).isIn(401, 403);
        assertThat(scrape("prometheus", "wrong-token").getStatusCode().value()).isIn(401, 403);
    }

    @Test
    void tokenDoesNotOpenOtherActuatorEndpoints() {
        HttpHeaders headers = new HttpHeaders();
        headers.setBasicAuth("prometheus", "test-scrape-token");
        ResponseEntity<String> response = restTemplate.exchange(
                "/actuator/metrics", HttpMethod.GET, new HttpEntity<>(headers), String.class);

        assertThat(response.getStatusCode().value()).isIn(401, 403);
    }
}
