/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CouponPricingResponse } from '../models/CouponPricingResponse';
import type { CouponResponse } from '../models/CouponResponse';
import type { CreateCouponRequest } from '../models/CreateCouponRequest';
import type { ValidateCouponRequest } from '../models/ValidateCouponRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class CouponsService {
    /**
     * Create coupon
     * Create a course coupon by admin or owning instructor
     * @param requestBody
     * @returns CouponResponse OK
     * @throws ApiError
     */
    public static createCoupon(
        requestBody: CreateCouponRequest,
    ): CancelablePromise<CouponResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/coupons',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Validate coupon
     * Validate a coupon and return computed pricing
     * @param requestBody
     * @returns CouponPricingResponse OK
     * @throws ApiError
     */
    public static validateCoupon(
        requestBody: ValidateCouponRequest,
    ): CancelablePromise<CouponPricingResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/coupons/validate',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Deactivate coupon
     * Deactivate a coupon
     * @param couponId
     * @returns any OK
     * @throws ApiError
     */
    public static deactivateCoupon(
        couponId: number,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/coupons/{couponId}/deactivate',
            path: {
                'couponId': couponId,
            },
        });
    }
    /**
     * Delete coupon
     * Permanently delete a coupon
     * @param couponId
     * @returns any OK
     * @throws ApiError
     */
    public static deleteCoupon(
        couponId: number,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/coupons/{couponId}',
            path: {
                'couponId': couponId,
            },
        });
    }
    /**
     * Get course coupons
     * Get coupons for a specific course
     * @param courseId
     * @returns CouponResponse OK
     * @throws ApiError
     */
    public static getCourseCoupons(
        courseId: number,
    ): CancelablePromise<Array<CouponResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/coupons/course/{courseId}',
            path: {
                'courseId': courseId,
            },
        });
    }
}
