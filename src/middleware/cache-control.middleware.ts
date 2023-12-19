import {NextFunction, Request, Response} from "express";

export const cacheControlHandler = (
    request: Request,
    response: Response,
    next: NextFunction
) => {
    if(response.statusCode === 200) {
        response.set('Cache-Control', 'public, max-age=1800, s-maxage=3600');
        next();
    }
};