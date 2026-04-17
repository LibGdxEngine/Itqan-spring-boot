/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { LessonReorderRequest } from '../models/LessonReorderRequest';
import type { LessonResponse } from '../models/LessonResponse';
import type { ModuleRequest } from '../models/ModuleRequest';
import type { ModuleResponse } from '../models/ModuleResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ModulesService {
    /**
     * Get module by ID
     * Get a module by its ID
     * @param id
     * @returns ModuleResponse OK
     * @throws ApiError
     */
    public static getModuleById(
        id: number,
    ): CancelablePromise<ModuleResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/modules/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Update module
     * Update an existing module
     * @param id
     * @param requestBody
     * @returns ModuleResponse OK
     * @throws ApiError
     */
    public static updateModule(
        id: number,
        requestBody: ModuleRequest,
    ): CancelablePromise<ModuleResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/modules/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Delete module
     * Delete a module
     * @param id
     * @returns any OK
     * @throws ApiError
     */
    public static deleteModule(
        id: number,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/modules/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Create a new module
     * Create a new module
     * @param requestBody
     * @returns ModuleResponse OK
     * @throws ApiError
     */
    public static createModule(
        requestBody: ModuleRequest,
    ): CancelablePromise<ModuleResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/modules',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Reorder module lessons
     * Reorder lessons within a module by drag-and-drop order
     * @param id
     * @param requestBody
     * @returns LessonResponse OK
     * @throws ApiError
     */
    public static reorderLessons(
        id: number,
        requestBody: LessonReorderRequest,
    ): CancelablePromise<Array<LessonResponse>> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/modules/{id}/lessons/reorder',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Get modules by course ID
     * Get all modules for a specific course
     * @param courseId
     * @returns ModuleResponse OK
     * @throws ApiError
     */
    public static getModulesByCourseId(
        courseId: number,
    ): CancelablePromise<Array<ModuleResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/modules/course/{courseId}',
            path: {
                'courseId': courseId,
            },
        });
    }
}
