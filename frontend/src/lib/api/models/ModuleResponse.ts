/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { LessonResponse } from './LessonResponse';
export type ModuleResponse = {
    id?: number;
    title?: string;
    description?: string;
    orderIndex?: number;
    active?: boolean;
    courseId?: number;
    lessons?: Array<LessonResponse>;
    createdAt?: string;
    updatedAt?: string;
};

