/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type AuditLog = {
    id?: number;
    actorUserId?: number;
    actorEmail?: string;
    action?: string;
    resourceType?: string;
    resourceId?: string;
    ipAddress?: string;
    userAgent?: string;
    metadata?: Record<string, any>;
    status?: AuditLog.status;
    createdAt?: string;
};
export namespace AuditLog {
    export enum status {
        SUCCESS = 'SUCCESS',
        FAILURE = 'FAILURE',
    }
}

