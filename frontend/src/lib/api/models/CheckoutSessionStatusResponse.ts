/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type CheckoutSessionStatusResponse = {
    sessionId?: string;
    status?: CheckoutSessionStatusResponse.status;
    paymentId?: number;
    courseId?: number;
};
export namespace CheckoutSessionStatusResponse {
    export enum status {
        PENDING = 'PENDING',
        COMPLETED = 'COMPLETED',
        FAILED = 'FAILED',
        REFUNDED = 'REFUNDED',
        CANCELLED = 'CANCELLED',
    }
}

