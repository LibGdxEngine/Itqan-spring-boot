package com.itqan.edu.features.payments.easykash;

import java.math.BigDecimal;

public record EasyKashPayRequest(
        BigDecimal amount,
        String currency,
        String name,
        String email,
        String mobile,
        String redirectUrl,
        String customerReference) {
}
