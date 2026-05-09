/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Course } from '../models/Course';
import type { Lesson } from '../models/Lesson';
import type { Module } from '../models/Module';
import type { ModuleReorderRequest } from '../models/ModuleReorderRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AdminContentControllerService {
    /**
     * @param moduleId
     * @param files
     * @returns Lesson OK
     * @throws ApiError
     */
    public static bulkUploadLessons(
        moduleId: number,
        files: Array<Blob>,
    ): CancelablePromise<Array<Lesson>> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/admin/modules/{moduleId}/lessons/bulk-upload',
            path: {
                'moduleId': moduleId,
            },
            query: {
                'files': files,
            },
        });
    }
    /**
     * @param courseId
     * @returns Course OK
     * @throws ApiError
     */
    public static duplicateCourse(
        courseId: number,
    ): CancelablePromise<Course> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/admin/courses/{courseId}/duplicate',
            path: {
                'courseId': courseId,
            },
        });
    }
    /**
     * @param courseId
     * @param requestBody
     * @returns Module OK
     * @throws ApiError
     */
    public static reorderModules(
        courseId: number,
        requestBody: ModuleReorderRequest,
    ): CancelablePromise<Array<Module>> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/admin/courses/{courseId}/modules/reorder',
            path: {
                'courseId': courseId,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
