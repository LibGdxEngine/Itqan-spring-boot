/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { QuestionResponse } from './QuestionResponse';
export type QuizResponse = {
    id?: number;
    title?: string;
    description?: string;
    passingScore?: number;
    timeLimit?: number;
    attemptsAllowed?: number;
    showCorrectAnswers?: boolean;
    active?: boolean;
    lessonId?: number;
    moduleId?: number;
    questions?: Array<QuestionResponse>;
    createdAt?: string;
    updatedAt?: string;
};

