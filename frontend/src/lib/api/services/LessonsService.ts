/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { LessonRequest } from '../models/LessonRequest';
import type { LessonResponse } from '../models/LessonResponse';
import type { LessonVideoMultipartAbortRequest } from '../models/LessonVideoMultipartAbortRequest';
import type { LessonVideoMultipartCompleteRequest } from '../models/LessonVideoMultipartCompleteRequest';
import type { LessonVideoMultipartInitiateRequest } from '../models/LessonVideoMultipartInitiateRequest';
import type { LessonVideoMultipartInitiateResponse } from '../models/LessonVideoMultipartInitiateResponse';
import type { LessonVideoPlaybackResponse } from '../models/LessonVideoPlaybackResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class LessonsService {
    /**
     * Get lesson by ID
     * Get a lesson by its ID
     * @param id
     * @returns LessonResponse OK
     * @throws ApiError
     */
    public static getLessonById(
        id: number,
    ): CancelablePromise<LessonResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/lessons/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Update lesson
     * Update an existing lesson
     * @param id
     * @param requestBody
     * @returns LessonResponse OK
     * @throws ApiError
     */
    public static updateLesson(
        id: number,
        requestBody: LessonRequest,
    ): CancelablePromise<LessonResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/lessons/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Delete lesson
     * Delete a lesson
     * @param id
     * @returns any OK
     * @throws ApiError
     */
    public static deleteLesson(
        id: number,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/lessons/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Create a new lesson
     * Create a new lesson
     * @param requestBody
     * @returns LessonResponse OK
     * @throws ApiError
     */
    public static createLesson(
        requestBody: LessonRequest,
    ): CancelablePromise<LessonResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/lessons',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Initiate lesson video multipart upload
     * Create multipart upload and pre-signed URLs
     * @param id
     * @param requestBody
     * @returns LessonVideoMultipartInitiateResponse OK
     * @throws ApiError
     */
    public static initiateMultipartUpload(
        id: number,
        requestBody: LessonVideoMultipartInitiateRequest,
    ): CancelablePromise<LessonVideoMultipartInitiateResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/lessons/{id}/video/multipart/initiate',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Complete lesson video multipart upload
     * Finalize multipart upload and attach video to lesson
     * @param id
     * @param requestBody
     * @returns LessonResponse OK
     * @throws ApiError
     */
    public static completeMultipartUpload(
        id: number,
        requestBody: LessonVideoMultipartCompleteRequest,
    ): CancelablePromise<LessonResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/lessons/{id}/video/multipart/complete',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Abort lesson video multipart upload
     * Abort an in-progress multipart upload
     * @param id
     * @param requestBody
     * @returns any OK
     * @throws ApiError
     */
    public static abortMultipartUpload(
        id: number,
        requestBody: LessonVideoMultipartAbortRequest,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/lessons/{id}/video/multipart/abort',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Get lesson video playback URL
     * Get a short-lived pre-signed video playback URL
     * @param id
     * @returns LessonVideoPlaybackResponse OK
     * @throws ApiError
     */
    public static getPlaybackUrl(
        id: number,
    ): CancelablePromise<LessonVideoPlaybackResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/lessons/{id}/video/playback-url',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Get lessons by module ID
     * Get all lessons for a specific module
     * @param moduleId
     * @returns LessonResponse OK
     * @throws ApiError
     */
    public static getLessonsByModuleId(
        moduleId: number,
    ): CancelablePromise<Array<LessonResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/lessons/module/{moduleId}',
            path: {
                'moduleId': moduleId,
            },
        });
    }
}
