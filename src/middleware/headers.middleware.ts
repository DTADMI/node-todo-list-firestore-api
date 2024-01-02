import { Request, Response, NextFunction } from "express";

export const headersHandler = (
    request: Request,
    response: Response,
    next: NextFunction) => {
    response.setHeader("Access-Control-Allow-Origin", `${process.env.SERVER_BASE_URL_CLIENT}`);
    response.setHeader("Access-Control-Allow-Methods", "POST, GET, PUT");
    response.setHeader("Access-Control-Allow-Headers", "Content-Type");
    next();
}