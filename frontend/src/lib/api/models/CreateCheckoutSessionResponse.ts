/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CouponPricingResponse } from './CouponPricingResponse';
export type CreateCheckoutSessionResponse = {
    mode?: CreateCheckoutSessionResponse.mode;
    checkoutUrl?: string;
    sessionId?: string;
    paymentId?: number;
    enrollmentId?: number;
    pricing?: CouponPricingResponse;
};
export namespace CreateCheckoutSessionResponse {
    export enum mode {
        REDIRECT = 'REDIRECT',
        FREE_ENROLLED = 'FREE_ENROLLED',
    }
}

