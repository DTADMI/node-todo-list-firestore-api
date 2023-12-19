import {NextFunction, Request, Response} from "express";

export const tryCatch = (
    controller: (request: Request, response: Response) => void) =>  (request: Request, response: Response, next: NextFunction) => {
    try {
        controller(request, response);
    } catch (error) {
        return next(error);
    }
};