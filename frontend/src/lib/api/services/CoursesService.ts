/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CourseRequest } from '../models/CourseRequest';
import type { CourseResponse } from '../models/CourseResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class CoursesService {
    /**
     * Get course by ID
     * Get a course by its ID
     * @param id
     * @returns CourseResponse OK
     * @throws ApiError
     */
    public static getCourseById(
        id: number,
    ): CancelablePromise<CourseResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/courses/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Update course
     * Update an existing course
     * @param id
     * @param requestBody
     * @returns CourseResponse OK
     * @throws ApiError
     */
    public static updateCourse(
        id: number,
        requestBody: CourseRequest,
    ): CancelablePromise<CourseResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/courses/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Delete course
     * Delete a course
     * @param id
     * @returns any OK
     * @throws ApiError
     */
    public static deleteCourse(
        id: number,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/courses/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Get all courses
     * Get all courses
     * @returns CourseResponse OK
     * @throws ApiError
     */
    public static getAllCourses(): CancelablePromise<Array<CourseResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/courses',
        });
    }
    /**
     * Create a new course
     * Create a new course
     * @param requestBody
     * @returns CourseResponse OK
     * @throws ApiError
     */
    public static createCourse(
        requestBody: CourseRequest,
    ): CancelablePromise<CourseResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/courses',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Deactivate course
     * Deactivate a course
     * @param id
     * @returns CourseResponse OK
     * @throws ApiError
     */
    public static deactivateCourse(
        id: number,
    ): CancelablePromise<CourseResponse> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/courses/{id}/deactivate',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Search and filter courses
     * Search courses with optional filters
     * @param query
     * @param level
     * @param category
     * @param minPrice
     * @param maxPrice
     * @param sort
     * @returns CourseResponse OK
     * @throws ApiError
     */
    public static searchCourses(
        query?: string,
        level?: string,
        category?: string,
        minPrice?: number,
        maxPrice?: number,
        sort: string = 'newest',
    ): CancelablePromise<Array<CourseResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/courses/search',
            query: {
                'query': query,
                'level': level,
                'category': category,
                'minPrice': minPrice,
                'maxPrice': maxPrice,
                'sort': sort,
            },
        });
    }
    /**
     * Get current instructor courses
     * Get courses owned by current instructor
     * @returns CourseResponse OK
     * @throws ApiError
     */
    public static getMyCourses(): CancelablePromise<Array<CourseResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/courses/mine',
        });
    }
    /**
     * Get active courses
     * Get all active courses
     * @returns CourseResponse OK
     * @throws ApiError
     */
    public static getActiveCourses(): CancelablePromise<Array<CourseResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/courses/active',
        });
    }
}
