/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type PaymentResponse = {
    id?: number;
    courseId?: number;
    courseTitle?: string;
    amount?: number;
    originalAmount?: number;
    discountAmount?: number;
    currency?: string;
    status?: PaymentResponse.status;
    paymentGateway?: string;
    transactionId?: string;
    couponCode?: string;
    checkoutSessionId?: string;
    createdAt?: string;
    completedAt?: string;
};
export namespace PaymentResponse {
    export enum status {
        PENDING = 'PENDING',
        COMPLETED = 'COMPLETED',
        FAILED = 'FAILED',
        REFUNDED = 'REFUNDED',
        CANCELLED = 'CANCELLED',
    }
}

