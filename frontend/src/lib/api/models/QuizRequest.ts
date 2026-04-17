/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { QuestionRequest } from './QuestionRequest';
export type QuizRequest = {
    title?: string;
    description?: string;
    passingScore?: number;
    timeLimit?: number;
    attemptsAllowed?: number;
    showCorrectAnswers?: boolean;
    lessonId?: number;
    moduleId?: number;
    questions?: Array<QuestionRequest>;
};

