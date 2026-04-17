/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { StudentAnswerResponse } from './StudentAnswerResponse';
export type QuizAttemptResponse = {
    id?: number;
    quizId?: number;
    quizTitle?: string;
    score?: number;
    passed?: boolean;
    startedAt?: string;
    completedAt?: string;
    timeSpent?: number;
    answers?: Array<StudentAnswerResponse>;
};

