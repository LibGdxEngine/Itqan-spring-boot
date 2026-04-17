/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ModuleResponse } from './ModuleResponse';
export type CourseResponse = {
    id?: number;
    title?: string;
    description?: string;
    instructor?: string;
    ownerUserId?: number;
    price?: number;
    duration?: number;
    level?: string;
    category?: string;
    thumbnailUrl?: string;
    tags?: Array<string>;
    active?: boolean;
    modules?: Array<ModuleResponse>;
    createdAt?: string;
    updatedAt?: string;
};

