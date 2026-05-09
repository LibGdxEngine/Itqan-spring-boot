/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Lesson } from './Lesson';
import type { Module } from './Module';
import type { Question } from './Question';
export type Quiz = {
    id?: number;
    title?: string;
    description?: string;
    passingScore?: number;
    timeLimit?: number;
    attemptsAllowed?: number;
    showCorrectAnswers?: boolean;
    active?: boolean;
    lesson?: Lesson;
    module?: Module;
    questions?: Array<Question>;
    createdAt?: string;
    updatedAt?: string;
};

