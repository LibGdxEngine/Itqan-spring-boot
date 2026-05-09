/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type AuthResponse = {
    id?: number;
    token?: string;
    refreshToken?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    role?: AuthResponse.role;
    superAdmin?: boolean;
};
export namespace AuthResponse {
    export enum role {
        STUDENT = 'STUDENT',
        INSTRUCTOR = 'INSTRUCTOR',
        ADMIN = 'ADMIN',
    }
}

