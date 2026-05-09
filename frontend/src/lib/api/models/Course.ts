/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Module } from './Module';
export type Course = {
    id?: number;
    title?: string;
    description?: string;
    instructor?: string;
    ownerUserId?: number;
    price?: number;
    duration?: number;
    level?: string;
    active?: boolean;
    category?: string;
    thumbnailUrl?: string;
    tags?: Array<string>;
    createdAt?: string;
    updatedAt?: string;
    modules?: Array<Module>;
};

