/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CheckoutSessionStatusResponse } from '../models/CheckoutSessionStatusResponse';
import type { CreateCheckoutSessionRequest } from '../models/CreateCheckoutSessionRequest';
import type { CreateCheckoutSessionResponse } from '../models/CreateCheckoutSessionResponse';
import type { PaymentResponse } from '../models/PaymentResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class PaymentsService {
    /**
     * Stripe webhook endpoint
     * Handles Stripe checkout webhook events
     * @param stripeSignature
     * @param requestBody
     * @returns string OK
     * @throws ApiError
     */
    public static stripeWebhook(
        stripeSignature: string,
        requestBody: string,
    ): CancelablePromise<Record<string, string>> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/payments/webhook/stripe',
            headers: {
                'Stripe-Signature': stripeSignature,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Create checkout session
     * Create Stripe checkout session for course purchase
     * @param requestBody
     * @returns CreateCheckoutSessionResponse OK
     * @throws ApiError
     */
    public static createCheckoutSession(
        requestBody: CreateCheckoutSessionRequest,
    ): CancelablePromise<CreateCheckoutSessionResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/payments/checkout-sessions',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Get current student payment history
     * Returns payment history for current student
     * @returns PaymentResponse OK
     * @throws ApiError
     */
    public static myPayments(): CancelablePromise<Array<PaymentResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/payments/me',
        });
    }
    /**
     * Get checkout session status
     * Returns payment status for checkout session
     * @param sessionId
     * @returns CheckoutSessionStatusResponse OK
     * @throws ApiError
     */
    public static checkoutSessionStatus(
        sessionId: string,
    ): CancelablePromise<CheckoutSessionStatusResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/payments/checkout-sessions/{sessionId}',
            path: {
                'sessionId': sessionId,
            },
        });
    }
}
