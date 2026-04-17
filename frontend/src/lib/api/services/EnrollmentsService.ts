/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { EnrollmentRequest } from '../models/EnrollmentRequest';
import type { EnrollmentResponse } from '../models/EnrollmentResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class EnrollmentsService {
    /**
     * Enroll student
     * Enroll current student in a course
     * @param requestBody
     * @returns EnrollmentResponse OK
     * @throws ApiError
     */
    public static enrollStudent(
        requestBody: EnrollmentRequest,
    ): CancelablePromise<EnrollmentResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/enrollments',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Mark lesson as complete
     * Mark a lesson as completed for a student
     * @param studentId
     * @param lessonId
     * @returns any OK
     * @throws ApiError
     */
    public static completeLesson(
        studentId: number,
        lessonId: number,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/enrollments/lessons/{lessonId}/complete',
            path: {
                'lessonId': lessonId,
            },
            query: {
                'studentId': studentId,
            },
        });
    }
    /**
     * Mark lesson as incomplete
     * Mark a lesson as incomplete for a student
     * @param studentId
     * @param lessonId
     * @returns any OK
     * @throws ApiError
     */
    public static markLessonIncomplete(
        studentId: number,
        lessonId: number,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/enrollments/lessons/{lessonId}/complete',
            path: {
                'lessonId': lessonId,
            },
            query: {
                'studentId': studentId,
            },
        });
    }
    /**
     * Get student enrollments
     * Get all enrollments for a student
     * @param studentId
     * @returns EnrollmentResponse OK
     * @throws ApiError
     */
    public static getStudentEnrollments(
        studentId: number,
    ): CancelablePromise<Array<EnrollmentResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/enrollments/student/{studentId}',
            path: {
                'studentId': studentId,
            },
        });
    }
    /**
     * Get completed lessons
     * Get list of completed lesson IDs for a student in a course
     * @param studentId
     * @param courseId
     * @returns number OK
     * @throws ApiError
     */
    public static getCompletedLessons(
        studentId: number,
        courseId: number,
    ): CancelablePromise<Array<number>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/enrollments/student/{studentId}/course/{courseId}/completed-lessons',
            path: {
                'studentId': studentId,
                'courseId': courseId,
            },
        });
    }
    /**
     * Check enrollment
     * Check if student is enrolled in a course
     * @param studentId
     * @param courseId
     * @returns boolean OK
     * @throws ApiError
     */
    public static checkEnrollment(
        studentId: number,
        courseId: number,
    ): CancelablePromise<boolean> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/enrollments/check',
            query: {
                'studentId': studentId,
                'courseId': courseId,
            },
        });
    }
    /**
     * Delete enrollment
     * Unenroll student from a course
     * @param id
     * @returns any OK
     * @throws ApiError
     */
    public static deleteEnrollment(
        id: number,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/enrollments/{id}',
            path: {
                'id': id,
            },
        });
    }
}
