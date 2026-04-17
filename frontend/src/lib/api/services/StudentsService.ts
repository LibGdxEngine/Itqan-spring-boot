/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { StudentRequest } from '../models/StudentRequest';
import type { StudentResponse } from '../models/StudentResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class StudentsService {
    /**
     * Get student by ID
     * Get a student by its ID
     * @param id
     * @returns StudentResponse OK
     * @throws ApiError
     */
    public static getStudentById(
        id: number,
    ): CancelablePromise<StudentResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/students/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Update student
     * Update an existing student
     * @param id
     * @param requestBody
     * @returns StudentResponse OK
     * @throws ApiError
     */
    public static updateStudent(
        id: number,
        requestBody: StudentRequest,
    ): CancelablePromise<StudentResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/students/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Delete student
     * Delete a student
     * @param id
     * @returns any OK
     * @throws ApiError
     */
    public static deleteStudent(
        id: number,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/students/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Get all students
     * Get all students
     * @returns StudentResponse OK
     * @throws ApiError
     */
    public static getAllStudents(): CancelablePromise<Array<StudentResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/students',
        });
    }
    /**
     * Create a new student
     * Create a new student
     * @param requestBody
     * @returns StudentResponse OK
     * @throws ApiError
     */
    public static createStudent(
        requestBody: StudentRequest,
    ): CancelablePromise<StudentResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/students',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Deactivate student
     * Deactivate a student
     * @param id
     * @returns StudentResponse OK
     * @throws ApiError
     */
    public static deactivateStudent(
        id: number,
    ): CancelablePromise<StudentResponse> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/students/{id}/deactivate',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Get current student profile
     * Get profile of the currently logged in student
     * @returns StudentResponse OK
     * @throws ApiError
     */
    public static getProfile(): CancelablePromise<StudentResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/students/profile',
        });
    }
    /**
     * Get active students
     * Get all active students
     * @returns StudentResponse OK
     * @throws ApiError
     */
    public static getActiveStudents(): CancelablePromise<Array<StudentResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/students/active',
        });
    }
}
