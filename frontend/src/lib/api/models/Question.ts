/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { QuestionOption } from './QuestionOption';
import type { Quiz } from './Quiz';
export type Question = {
    id?: number;
    questionText?: string;
    questionType?: Question.questionType;
    points?: number;
    orderIndex?: number;
    quiz?: Quiz;
    options?: Array<QuestionOption>;
    correctAnswer?: string;
};
export namespace Question {
    export enum questionType {
        MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
        TRUE_FALSE = 'TRUE_FALSE',
        SHORT_ANSWER = 'SHORT_ANSWER',
    }
}

