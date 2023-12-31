import HttpException from "../common/http-exception.js";
import { Request, Response } from "express";
import {writeError} from "../common/logger.service";

export const errorHandler = (
    error: HttpException,
    request: Request,
    response: Response
) => {
    const status = error.statusCode ?? 500;
    const message = `😱 An error occurred during the request 💀: ${JSON.stringify(error)}`;
    writeError(message);
    return response.status(status).send(message);
};