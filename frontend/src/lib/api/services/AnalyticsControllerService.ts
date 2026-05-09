/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AnalyticsOverviewResponse } from '../models/AnalyticsOverviewResponse';
import type { CoursePopularityResponse } from '../models/CoursePopularityResponse';
import type { RevenueTrendResponse } from '../models/RevenueTrendResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AnalyticsControllerService {
    /**
     * @param limit
     * @returns CoursePopularityResponse OK
     * @throws ApiError
     */
    public static getTopCourses(
        limit: number = 5,
    ): CancelablePromise<Array<CoursePopularityResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/admin/analytics/top-courses',
            query: {
                'limit': limit,
            },
        });
    }
    /**
     * @param days
     * @returns RevenueTrendResponse OK
     * @throws ApiError
     */
    public static getRevenueTrend(
        days: number = 30,
    ): CancelablePromise<RevenueTrendResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/admin/analytics/revenue-trend',
            query: {
                'days': days,
            },
        });
    }
    /**
     * @returns AnalyticsOverviewResponse OK
     * @throws ApiError
     */
    public static getOverview(): CancelablePromise<AnalyticsOverviewResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/admin/analytics/overview',
        });
    }
}
