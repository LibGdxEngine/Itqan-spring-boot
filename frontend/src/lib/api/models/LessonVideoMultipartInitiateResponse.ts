/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PartUploadUrl } from './PartUploadUrl';
export type LessonVideoMultipartInitiateResponse = {
    uploadId?: string;
    objectKey?: string;
    fileSizeBytes?: number;
    partSizeBytes?: number;
    partCount?: number;
    expiresAt?: string;
    partUrls?: Array<PartUploadUrl>;
};

