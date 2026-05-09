/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Pageable } from '../models/Pageable';
import type { PageAuditLog } from '../models/PageAuditLog';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AuditLogsService {
    /**
     * List all audit logs (paginated)
     * @param pageable
     * @returns PageAuditLog OK
     * @throws ApiError
     */
    public static getAll(
        pageable: Pageable,
    ): CancelablePromise<PageAuditLog> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/audit-logs',
            query: {
                'pageable': pageable,
            },
        });
    }
    /**
     * Get audit logs by resource type and ID
     * @param type
     * @param id
     * @param pageable
     * @returns PageAuditLog OK
     * @throws ApiError
     */
    public static getByResource(
        type: string,
        id: string,
        pageable: Pageable,
    ): CancelablePromise<PageAuditLog> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/audit-logs/resource/{type}/{id}',
            path: {
                'type': type,
                'id': id,
            },
            query: {
                'pageable': pageable,
            },
        });
    }
    /**
     * Get audit logs by actor user ID
     * @param userId
     * @param pageable
     * @returns PageAuditLog OK
     * @throws ApiError
     */
    public static getByActor(
        userId: number,
        pageable: Pageable,
    ): CancelablePromise<PageAuditLog> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/audit-logs/actor/{userId}',
            path: {
                'userId': userId,
            },
            query: {
                'pageable': pageable,
            },
        });
    }
}
