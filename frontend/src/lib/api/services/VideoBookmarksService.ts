/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { VideoBookmarkRequest } from '../models/VideoBookmarkRequest';
import type { VideoBookmarkResponse } from '../models/VideoBookmarkResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class VideoBookmarksService {
    /**
     * Get bookmark by ID
     * Get a specific bookmark by ID
     * @param id
     * @returns VideoBookmarkResponse OK
     * @throws ApiError
     */
    public static getBookmarkById(
        id: number,
    ): CancelablePromise<VideoBookmarkResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/bookmarks/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Update bookmark
     * Update an existing bookmark
     * @param id
     * @param requestBody
     * @returns VideoBookmarkResponse OK
     * @throws ApiError
     */
    public static updateBookmark(
        id: number,
        requestBody: VideoBookmarkRequest,
    ): CancelablePromise<VideoBookmarkResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/bookmarks/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Delete bookmark
     * Delete a bookmark
     * @param id
     * @returns any OK
     * @throws ApiError
     */
    public static deleteBookmark(
        id: number,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/bookmarks/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Get bookmarks by lesson
     * Get all bookmarks for a specific lesson
     * @param lessonId
     * @returns VideoBookmarkResponse OK
     * @throws ApiError
     */
    public static getBookmarksByLesson(
        lessonId: number,
    ): CancelablePromise<Array<VideoBookmarkResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/lessons/{lessonId}/bookmarks',
            path: {
                'lessonId': lessonId,
            },
        });
    }
    /**
     * Create bookmark
     * Create a video bookmark for a lesson
     * @param lessonId
     * @param requestBody
     * @returns VideoBookmarkResponse OK
     * @throws ApiError
     */
    public static createBookmark(
        lessonId: number,
        requestBody: VideoBookmarkRequest,
    ): CancelablePromise<VideoBookmarkResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/lessons/{lessonId}/bookmarks',
            path: {
                'lessonId': lessonId,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Get all bookmarks
     * Get all bookmarks for the authenticated student
     * @returns VideoBookmarkResponse OK
     * @throws ApiError
     */
    public static getAllBookmarks(): CancelablePromise<Array<VideoBookmarkResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/bookmarks',
        });
    }
}
