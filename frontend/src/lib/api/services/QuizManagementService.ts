/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { QuizAttemptResponse } from '../models/QuizAttemptResponse';
import type { QuizRequest } from '../models/QuizRequest';
import type { QuizResponse } from '../models/QuizResponse';
import type { SubmitQuizRequest } from '../models/SubmitQuizRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class QuizManagementService {
    /**
     * Get quiz details
     * @param quizId
     * @returns QuizResponse OK
     * @throws ApiError
     */
    public static getQuiz(
        quizId: number,
    ): CancelablePromise<QuizResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/quizzes/{quizId}',
            path: {
                'quizId': quizId,
            },
        });
    }
    /**
     * Update quiz
     * @param quizId
     * @param requestBody
     * @returns QuizResponse OK
     * @throws ApiError
     */
    public static updateQuiz(
        quizId: number,
        requestBody: QuizRequest,
    ): CancelablePromise<QuizResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/quizzes/{quizId}',
            path: {
                'quizId': quizId,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Delete quiz
     * @param quizId
     * @returns any OK
     * @throws ApiError
     */
    public static deleteQuiz(
        quizId: number,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/quizzes/{quizId}',
            path: {
                'quizId': quizId,
            },
        });
    }
    /**
     * Create a new quiz
     * @param requestBody
     * @returns QuizResponse OK
     * @throws ApiError
     */
    public static createQuiz(
        requestBody: QuizRequest,
    ): CancelablePromise<QuizResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/quizzes',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Start a quiz attempt
     * @param quizId
     * @returns QuizAttemptResponse OK
     * @throws ApiError
     */
    public static startQuizAttempt(
        quizId: number,
    ): CancelablePromise<QuizAttemptResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/quizzes/{quizId}/attempts',
            path: {
                'quizId': quizId,
            },
        });
    }
    /**
     * Submit quiz answers
     * @param attemptId
     * @param requestBody
     * @returns QuizAttemptResponse OK
     * @throws ApiError
     */
    public static submitQuiz(
        attemptId: number,
        requestBody: SubmitQuizRequest,
    ): CancelablePromise<QuizAttemptResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/quizzes/attempts/{attemptId}/submit',
            path: {
                'attemptId': attemptId,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Get student's quiz attempts
     * @returns QuizAttemptResponse OK
     * @throws ApiError
     */
    public static getMyAttempts(): CancelablePromise<Array<QuizAttemptResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/quizzes/my-attempts',
        });
    }
    /**
     * Get quiz attempt results
     * @param attemptId
     * @returns QuizAttemptResponse OK
     * @throws ApiError
     */
    public static getAttemptResults(
        attemptId: number,
    ): CancelablePromise<QuizAttemptResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/quizzes/attempts/{attemptId}',
            path: {
                'attemptId': attemptId,
            },
        });
    }
}
