// src/middleware/error.middleware.ts

import { Request, Response, NextFunction } from "express";
import admin from "firebase-admin";

export const authenticationHandler = (
    request: Request,
    response: Response,
    next: NextFunction) => {
    const authHeader = request.headers['authorization'];
    console.log(`authHeader : ${authHeader}`);
    const token = authHeader && authHeader.split(' ')[1];
    console.log(`token : ${token}`);
    if (token == null || !token.length) {
        return response.sendStatus(401);
    }

    admin.auth().verifyIdToken(token)
        .then( (decodedIdToken) => {
            console.log(`decodedIdToken: ${JSON.stringify(decodedIdToken)}`);
            next();
        })
        .catch((error) => {
            console.error(`error: ${JSON.stringify(error)}`);
            return response.status(403).send(JSON.stringify(error));
        })
}