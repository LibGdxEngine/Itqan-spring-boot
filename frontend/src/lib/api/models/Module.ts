/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Course } from './Course';
import type { Lesson } from './Lesson';
import type { Quiz } from './Quiz';
export type Module = {
    id?: number;
    title?: string;
    description?: string;
    orderIndex?: number;
    active?: boolean;
    course?: Course;
    lessons?: Array<Lesson>;
    quiz?: Quiz;
    createdAt?: string;
    updatedAt?: string;
};

