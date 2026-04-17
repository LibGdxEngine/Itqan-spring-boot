/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type LessonRequest = {
    title: string;
    description?: string;
    type: LessonRequest.type;
    videoUrl?: string;
    content?: string;
    resourceUrl?: string;
    duration?: number;
    orderIndex: number;
    isFree?: boolean;
    active?: boolean;
    moduleId: number;
};
export namespace LessonRequest {
    export enum type {
        VIDEO = 'VIDEO',
        TEXT = 'TEXT',
        QUIZ = 'QUIZ',
        ASSIGNMENT = 'ASSIGNMENT',
    }
}

