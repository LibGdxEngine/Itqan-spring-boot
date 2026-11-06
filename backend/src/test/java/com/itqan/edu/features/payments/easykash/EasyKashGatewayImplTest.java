package com.itqan.edu.features.payments.easykash;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.itqan.edu.common.exception.BusinessException;
import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.math.BigDecimal;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/** Exercises the real HTTP client against a local stand-in for EasyKash. */
class EasyKashGatewayImplTest {

    private final ObjectMapper mapper = new ObjectMapper();
    private final AtomicReference<String> authorization = new AtomicReference<>();
    private final AtomicReference<String> path = new AtomicReference<>();
    private final AtomicReference<String> requestBody = new AtomicReference<>();
    private HttpServer server;
    private EasyKashGatewayImpl gateway;
    private volatile int responseStatus = 200;
    private volatile String responseContentType = "text/html; charset=utf-8";
    private volatile String responseBody = "";

    @BeforeEach
    void startServer() throws IOException {
        server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/", exchange -> {
            authorization.set(exchange.getRequestHeaders().getFirst("authorization"));
            path.set(exchange.getRequestURI().getPath());
            requestBody.set(new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8));
            byte[] bytes = responseBody.getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().set("Content-Type", responseContentType);
            exchange.sendResponseHeaders(responseStatus, bytes.length == 0 ? -1 : bytes.length);
            if (bytes.length > 0) {
                exchange.getResponseBody().write(bytes);
            }
            exchange.close();
        });
        server.start();

        EasyKashProperties properties = new EasyKashProperties();
        properties.setBaseUrl("http://127.0.0.1:" + server.getAddress().getPort());
        properties.setApiKey("the-api-key");
        properties.setHmacSecret("secret");
        gateway = new EasyKashGatewayImpl(properties, mapper);
    }

    @AfterEach
    void stopServer() {
        server.stop(0);
    }

    private EasyKashPayRequest request() {
        return new EasyKashPayRequest(new BigDecimal("150.00"), "EGP", "Sara Ali", "s@test.com", "01012345678",
                "https://itqan.test/courses/success", "ITQ1XABC");
    }

    @Test
    void createPayLink_sendsTheDocumentedRequestAndReadsTheLink() throws Exception {
        responseBody = "{\"redirectUrl\":\"https://www.easykash.net/DirectPayV1/ABC\"}";

        assertThat(gateway.createPayLink(request())).isEqualTo("https://www.easykash.net/DirectPayV1/ABC");

        assertThat(path.get()).isEqualTo("/api/directpayv1/pay");
        assertThat(authorization.get()).isEqualTo("the-api-key");
        JsonNode sent = mapper.readTree(requestBody.get());
        assertThat(sent.path("amount").decimalValue()).isEqualByComparingTo("150.00");
        assertThat(sent.path("amount").isNumber()).isTrue();
        assertThat(sent.path("currency").asText()).isEqualTo("EGP");
        assertThat(sent.path("cashExpiry").asInt()).isEqualTo(48);
        assertThat(sent.path("name").asText()).isEqualTo("Sara Ali");
        assertThat(sent.path("email").asText()).isEqualTo("s@test.com");
        assertThat(sent.path("mobile").isTextual()).isTrue();
        assertThat(sent.path("redirectUrl").asText()).isEqualTo("https://itqan.test/courses/success");
        assertThat(sent.path("customerReference").asText()).isEqualTo("ITQ1XABC");
        assertThat(sent.has("paymentOptions")).isFalse();
    }

    @Test
    void createPayLink_turnsGatewayFailuresIntoABusinessError() {
        responseStatus = 401;
        responseBody = "{\"message\":\"unauthorized\"}";
        assertThatThrownBy(() -> gateway.createPayLink(request())).isInstanceOf(BusinessException.class);

        responseStatus = 200;
        responseBody = "{}";
        assertThatThrownBy(() -> gateway.createPayLink(request())).isInstanceOf(BusinessException.class);

        responseBody = "<html>not json</html>";
        assertThatThrownBy(() -> gateway.createPayLink(request())).isInstanceOf(BusinessException.class);
    }

    @Test
    void inquire_readsTheDocumentedResponse() throws Exception {
        responseContentType = "application/json";
        responseBody = """
                {"PaymentMethod":"Cash Through Fawry","Amount":"10.05","BuyerName":"John Doe","BuyerEmail":"j@e.com",
                 "BuyerMobile":"01010101010","status":"PAID","voucher":"32423432","easykashRef":"1206102054"}
                """;

        EasyKashResult result = gateway.inquire("ITQ1XABC").orElseThrow();

        assertThat(path.get()).isEqualTo("/api/cash-api/inquire");
        assertThat(mapper.readTree(requestBody.get()).path("customerReference").asText()).isEqualTo("ITQ1XABC");
        assertThat(result.outcome()).isEqualTo(EasyKashResult.Outcome.PAID);
        assertThat(result.easykashRef()).isEqualTo("1206102054");
        assertThat(result.paymentMethod()).isEqualTo("Cash Through Fawry");
        assertThat(result.amount()).isEqualTo("10.05");
    }

    @Test
    void inquire_isEmptyWhenEasyKashHasNoAnswer() {
        responseStatus = 404;
        responseBody = "{\"message\":\"not found\"}";
        assertThat(gateway.inquire("ITQ1XABC")).isEmpty();

        responseStatus = 200;
        responseBody = "{\"message\":\"no status here\"}";
        assertThat(gateway.inquire("ITQ1XABC")).isEmpty();

        responseBody = "not json";
        assertThat(gateway.inquire("ITQ1XABC")).isEmpty();
    }
}
