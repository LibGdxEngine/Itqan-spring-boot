/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type LessonResponse = {
    id?: number;
    title?: string;
    description?: string;
    type?: LessonResponse.type;
    videoUrl?: string;
    videoObjectKey?: string;
    videoMimeType?: string;
    videoSizeBytes?: number;
    videoStatus?: LessonResponse.videoStatus;
    videoUploadedAt?: string;
    content?: string;
    resourceUrl?: string;
    duration?: number;
    orderIndex?: number;
    isFree?: boolean;
    active?: boolean;
    moduleId?: number;
    createdAt?: string;
    updatedAt?: string;
};
export namespace LessonResponse {
    export enum type {
        VIDEO = 'VIDEO',
        TEXT = 'TEXT',
        QUIZ = 'QUIZ',
        ASSIGNMENT = 'ASSIGNMENT',
    }
    export enum videoStatus {
        PENDING = 'PENDING',
        UPLOADING = 'UPLOADING',
        READY = 'READY',
        FAILED = 'FAILED',
    }
}

