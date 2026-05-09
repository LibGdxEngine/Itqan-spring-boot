/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Module } from './Module';
import type { Quiz } from './Quiz';
export type Lesson = {
    id?: number;
    title?: string;
    description?: string;
    type?: Lesson.type;
    videoUrl?: string;
    videoObjectKey?: string;
    videoMimeType?: string;
    videoSizeBytes?: number;
    videoStatus?: Lesson.videoStatus;
    videoUploadedAt?: string;
    content?: string;
    resourceUrl?: string;
    duration?: number;
    orderIndex?: number;
    isFree?: boolean;
    active?: boolean;
    module?: Module;
    quiz?: Quiz;
    createdAt?: string;
    updatedAt?: string;
};
export namespace Lesson {
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

