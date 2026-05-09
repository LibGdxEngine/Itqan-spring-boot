/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { InstructorCreateRequest } from '../models/InstructorCreateRequest';
import type { InstructorResponse } from '../models/InstructorResponse';
import type { InstructorUpdateRequest } from '../models/InstructorUpdateRequest';
import type { Pageable } from '../models/Pageable';
import type { PageInstructorResponse } from '../models/PageInstructorResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class InstructorsService {
    /**
     * Update instructor
     * Update an existing instructor user (super admin only)
     * @param id
     * @param requestBody
     * @returns InstructorResponse OK
     * @throws ApiError
     */
    public static updateInstructor(
        id: number,
        requestBody: InstructorUpdateRequest,
    ): CancelablePromise<InstructorResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/instructors/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Get all instructors (paginated)
     * Get all instructor users with pagination
     * @param pageable
     * @returns PageInstructorResponse OK
     * @throws ApiError
     */
    public static getAllInstructors(
        pageable: Pageable,
    ): CancelablePromise<PageInstructorResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/instructors',
            query: {
                'pageable': pageable,
            },
        });
    }
    /**
     * Create instructor
     * Create a new instructor user (super admin only)
     * @param requestBody
     * @returns InstructorResponse OK
     * @throws ApiError
     */
    public static createInstructor(
        requestBody: InstructorCreateRequest,
    ): CancelablePromise<InstructorResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/instructors',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Deactivate instructor
     * Deactivate an instructor user (super admin only)
     * @param id
     * @returns InstructorResponse OK
     * @throws ApiError
     */
    public static deactivateInstructor(
        id: number,
    ): CancelablePromise<InstructorResponse> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/instructors/{id}/deactivate',
            path: {
                'id': id,
            },
        });
    }
}
