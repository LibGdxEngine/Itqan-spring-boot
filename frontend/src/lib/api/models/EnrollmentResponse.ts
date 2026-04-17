/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CourseResponse } from './CourseResponse';
export type EnrollmentResponse = {
    id?: number;
    studentId?: number;
    courseId?: number;
    course?: CourseResponse;
    status?: EnrollmentResponse.status;
    progress?: number;
    enrolledAt?: string;
    completedAt?: string;
    lastAccessedAt?: string;
};
export namespace EnrollmentResponse {
    export enum status {
        ACTIVE = 'ACTIVE',
        COMPLETED = 'COMPLETED',
        DROPPED = 'DROPPED',
    }
}

