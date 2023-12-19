// src/common/http-exception.ts

export default class HttpException extends Error {
    statusCode?: number;
    message: string;
    error?: string | null;

    constructor(message: string, error?: string | null, statusCode?: number) {
        super(message);

        this.message = message;
        this.statusCode = statusCode ?? 500;
        if(error) {
            this.error = error;
        }
    }
}