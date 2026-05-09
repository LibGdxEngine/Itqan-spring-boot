/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AdminCreateRequest } from '../models/AdminCreateRequest';
import type { AdminResponse } from '../models/AdminResponse';
import type { AdminUpdateRequest } from '../models/AdminUpdateRequest';
import type { Pageable } from '../models/Pageable';
import type { PageAdminResponse } from '../models/PageAdminResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AdminsService {
    /**
     * Update admin
     * Update an existing admin user (super admin only)
     * @param id
     * @param requestBody
     * @returns AdminResponse OK
     * @throws ApiError
     */
    public static updateAdmin(
        id: number,
        requestBody: AdminUpdateRequest,
    ): CancelablePromise<AdminResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/admins/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Get all admins (paginated)
     * Get all admin users with pagination
     * @param pageable
     * @returns PageAdminResponse OK
     * @throws ApiError
     */
    public static getAllAdmins(
        pageable: Pageable,
    ): CancelablePromise<PageAdminResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/admins',
            query: {
                'pageable': pageable,
            },
        });
    }
    /**
     * Create admin
     * Create a new admin user (super admin only)
     * @param requestBody
     * @returns AdminResponse OK
     * @throws ApiError
     */
    public static createAdmin(
        requestBody: AdminCreateRequest,
    ): CancelablePromise<AdminResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/admins',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
