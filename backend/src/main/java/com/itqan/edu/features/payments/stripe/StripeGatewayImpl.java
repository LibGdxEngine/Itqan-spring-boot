package com.itqan.edu.features.payments.stripe;

import com.itqan.edu.common.config.StripeProperties;
import com.itqan.edu.common.exception.BusinessException;
import com.itqan.edu.common.exception.ErrorCode;
import com.stripe.Stripe;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.exception.StripeException;
import com.stripe.model.Charge;
import com.stripe.model.Event;
import com.stripe.model.Refund;
import com.stripe.param.RefundCreateParams;
import com.stripe.model.StripeObject;
import com.stripe.model.checkout.Session;
import com.stripe.net.Webhook;
import com.stripe.param.checkout.SessionCreateParams;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class StripeGatewayImpl implements StripeGateway {

    private final StripeProperties stripeProperties;

    @Override
    public StripeCheckoutSessionResult createCheckoutSession(StripeCheckoutSessionRequest request) {
        Stripe.apiKey = stripeProperties.getSecretKey();

        SessionCreateParams.LineItem.PriceData.ProductData productData = SessionCreateParams.LineItem.PriceData.ProductData
                .builder()
                .setName(request.getProductName())
                .build();

        SessionCreateParams.LineItem.PriceData priceData = SessionCreateParams.LineItem.PriceData.builder()
                .setCurrency(request.getCurrency().toLowerCase())
                .setUnitAmount(request.getAmountInCents())
                .setProductData(productData)
                .build();

        SessionCreateParams.LineItem lineItem = SessionCreateParams.LineItem.builder()
                .setQuantity(1L)
                .setPriceData(priceData)
                .build();

        SessionCreateParams.Builder paramsBuilder = SessionCreateParams.builder()
                .setMode(SessionCreateParams.Mode.PAYMENT)
                .setSuccessUrl(request.getSuccessUrl())
                .setCancelUrl(request.getCancelUrl())
                .addLineItem(lineItem);

        Map<String, String> metadata = request.getMetadata();
        if (metadata != null) {
            metadata.forEach(paramsBuilder::putMetadata);
        }

        try {
            Session session = Session.create(paramsBuilder.build());
            return StripeCheckoutSessionResult.builder()
                    .sessionId(session.getId())
                    .checkoutUrl(session.getUrl())
                    .build();
        } catch (StripeException ex) {
            throw new BusinessException(ErrorCode.PAYMENT_GATEWAY_ERROR, ex.getMessage());
        }
    }

    @Override
    public StripeWebhookEvent parseWebhookEvent(String payload, String signatureHeader) {
        try {
            Event event = Webhook.constructEvent(payload, signatureHeader, stripeProperties.getWebhookSecret());

            Optional<StripeObject> objectOpt = event.getDataObjectDeserializer().getObject();
            String sessionId = null;
            String paymentIntentId = null;

            if (objectOpt.isPresent() && objectOpt.get() instanceof Session session) {
                sessionId = session.getId();
                paymentIntentId = session.getPaymentIntent();
            } else if (objectOpt.isPresent() && objectOpt.get() instanceof Charge charge) {
                paymentIntentId = charge.getPaymentIntent();
            }

            return StripeWebhookEvent.builder()
                    .eventId(event.getId())
                    .eventType(event.getType())
                    .checkoutSessionId(sessionId)
                    .paymentIntentId(paymentIntentId)
                    .build();
        } catch (SignatureVerificationException ex) {
            throw new BusinessException(ErrorCode.STRIPE_SIGNATURE_INVALID);
        }
    }

    @Override
    public void refundPaymentIntent(String paymentIntentId) {
        Stripe.apiKey = stripeProperties.getSecretKey();
        try {
            Refund.create(RefundCreateParams.builder().setPaymentIntent(paymentIntentId).build());
        } catch (StripeException ex) {
            throw new BusinessException(ErrorCode.PAYMENT_GATEWAY_ERROR, ex.getMessage());
        }
    }
}
