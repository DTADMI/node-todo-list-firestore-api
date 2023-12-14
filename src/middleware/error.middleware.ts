// src/middleware/error.middleware.ts

import HttpException from "../common/http-exception";
import { Request, Response, NextFunction } from "express";

export const errorHandler = (
    error: HttpException,
    request: Request,
    response: Response,
    next: NextFunction
) => {
    const status = (error.statusCode ?? error.status) ?? 500;
    const message = `😱 An error occurred during the request 💀: ${JSON.stringify(error)}`;
    console.error(message);
    return response.status(status).send(message);
};