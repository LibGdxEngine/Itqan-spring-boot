package com.itqan.edu.common.security;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import static org.assertj.core.api.Assertions.assertThat;

class RateLimitFilterTest {

    private final RateLimitFilter filter = new RateLimitFilter(true, 3, 2, 5);

    private MockHttpServletResponse post(String uri, String clientIp) throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", uri);
        request.setRequestURI(uri);
        request.addHeader("X-Real-IP", clientIp);
        MockHttpServletResponse response = new MockHttpServletResponse();
        filter.doFilter(request, response, new MockFilterChain());
        return response;
    }

    @Test
    void blocksLoginAfterLimitPerClient() throws Exception {
        for (int i = 0; i < 3; i++) {
            assertThat(post("/api/auth/login", "1.1.1.1").getStatus()).isEqualTo(200);
        }
        MockHttpServletResponse blocked = post("/api/auth/login", "1.1.1.1");
        assertThat(blocked.getStatus()).isEqualTo(429);
        assertThat(blocked.getHeader("Retry-After")).isNotBlank();

        // A different client is unaffected.
        assertThat(post("/api/auth/login", "2.2.2.2").getStatus()).isEqualTo(200);
    }

    @Test
    void forgotPasswordHasItsOwnStricterBucket() throws Exception {
        assertThat(post("/api/auth/forgot-password", "3.3.3.3").getStatus()).isEqualTo(200);
        assertThat(post("/api/auth/forgot-password", "3.3.3.3").getStatus()).isEqualTo(200);
        assertThat(post("/api/auth/forgot-password", "3.3.3.3").getStatus()).isEqualTo(429);
    }

    @Test
    void ignoresUnlistedEndpoints() throws Exception {
        for (int i = 0; i < 10; i++) {
            assertThat(post("/api/courses", "4.4.4.4").getStatus()).isEqualTo(200);
        }
    }
}
