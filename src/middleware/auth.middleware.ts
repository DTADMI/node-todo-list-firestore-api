// src/middleware/error.middleware.ts

import { Request, Response, NextFunction } from "express";
import admin from "firebase-admin";
import {writeError, writeLog} from "../common/logger.service";

export const authenticationHandler = (
    request: Request,
    response: Response,
    next: NextFunction) => {
    const authHeader = request.headers['authorization'];
    writeLog(`authHeader : ${authHeader}`);
    const token = authHeader && authHeader.split(' ')[1];
    writeLog(`token : ${token}`);
    if (token == null || !token.length) {
        return response.sendStatus(401);
    }

    admin.auth().verifyIdToken(token)
        .then( (decodedIdToken) => {
            writeLog(`decodedIdToken: ${JSON.stringify(decodedIdToken)}`);
            next();
        })
        .catch((error) => {
            writeError(`error: ${JSON.stringify(error)}`);
            return response.status(403).send(JSON.stringify(error));
        })
}