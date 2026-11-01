package com.itqan.edu.features.payments.paymob;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PaymobIntentionRequest {
    private long amountCents;
    private String currency;
    private String itemName;
    /** Our own unique reference; Paymob echoes it back as order.merchant_order_id. */
    private String reference;
    private String firstName;
    private String lastName;
    private String email;
    private String phone;
    private String redirectionUrl;
    private String notificationUrl;
}
