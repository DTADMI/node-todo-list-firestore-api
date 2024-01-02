import { Request, Response, NextFunction } from "express";
import admin from "firebase-admin";
import {writeError, writeLog} from "../common/logger.service";
import {getSession, getToken, SESSION_KEYS} from "../common/session.service";

export const authorizationHandler = (
    request: Request,
    response: Response,
    next: NextFunction) => {
    const authHeader = request.headers["authorization"];
    const csrfHeader = request.headers["x-xsrf-token"];
    writeLog(`authHeader : ${authHeader}`);
    const token = authHeader?.split(' ')[1];
    const csrfToken = csrfHeader?.toString();
    const { __session } = request.cookies;
    writeLog(`token : ${token}`);
    writeLog(`sessionToken : ${__session}`);
    writeLog(`csrfToken : ${csrfToken}`);
    if(!__session || !getSession(__session)) {
        writeError(`Session token invalid or not provided.`);
        return response.status(401).send(`Session token invalid or not provided.`);
    }
    if (token == null || !token.length || token != getToken(__session, SESSION_KEYS.ACCESS_TOKEN)) {
        writeError(`Authorization token invalid or not provided.`);
        return response.status(401).send(`Authorization token invalid or not provided.`);
    }
    if(!csrfToken || csrfToken !== getSession(__session).csrfToken){
        writeError(`CSRF token invalid or not provided.`);
        return response.status(403).send(`CSRF token invalid or not provided.`);
    }

    admin.auth().verifySessionCookie(__session, true)
        .then((decodedClaims) => {
        writeLog(`Verifying session ${__session} returned decodeClaims ${JSON.stringify(decodedClaims)}`);
            admin.auth().verifyIdToken(token, true)
                .then( (decodedIdToken) => {
                    writeLog(`decodedIdToken: ${JSON.stringify(decodedIdToken)}`);
                    next();
                });
        })
        .catch((error) => {
            if(error === 'auth/id-token-revoked') {
                return response.status(401).send(`Session token was revoked`);
            }
            writeError(`An error occurred while verifying the session cookie ${__session} : ${JSON.stringify(error)}`);
            return response.status(403).send(JSON.stringify(error));
        });
}