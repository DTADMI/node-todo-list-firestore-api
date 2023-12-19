// src/middleware/not-found.middleware.ts

import { Request, Response, NextFunction } from "express";
import HttpException from "../common/http-exception.js";

export const notFoundHandler = (
    request: Request,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    response: Response,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    next: NextFunction
) => {

    const message = "😅 Resource not found! 🏳️";
    console.error(`The server received the request : ${JSON.stringify(request.path)} with parameters: ${JSON.stringify(request.params)}`);
    console.error(`${JSON.stringify(message)}`);
    throw new HttpException(message, null, 404);
};