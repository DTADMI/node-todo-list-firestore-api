/**
 * Required External Modules
 */

import express, {Request, Response} from "express";
import {tryCatch} from "../utils/tryCatch";
import HttpException from "../common/http-exception";
import {logInWithEmailAndPassword, signUpWithEmailAndPassword} from "../common/firebase";
import {writeError, writeLog} from "../common/logger.service";
import admin, {auth} from "firebase-admin";
import SessionCookieOptions = auth.SessionCookieOptions;
import {
    addToken,
    clearSession,
    createSession,
    getToken,
    SESSION_KEYS,
    sessionCookieOptions
} from "../common/session.service";



/**
 * App Variables
 */

export const authRouter = express.Router();
/**
 *  App Configuration
 */

authRouter.get(
    "/csrfToken",
    tryCatch((req: Request, res: Response) => {
        const { __session } = req.cookies;
        writeLog(`session token: ${__session}`)
        const csrfToken = crypto.randomUUID();
        writeLog(`csrf token:${csrfToken}`);
        addToken(__session, SESSION_KEYS.CSRF_TOKEN, csrfToken);
        res.status(200).send({csrfToken});
    })
);

authRouter.post(
    "/register",
    tryCatch((req: Request, res: Response) => {
        const { email, password } = req.body;
        writeLog(`register email : ${email} password : ${password}`);
        signUpWithEmailAndPassword(email, password)
            .then((userCredentials) => {
                const user = userCredentials.user;
                writeLog(`userCredentials : ${JSON.stringify(user)}`);
                user!.getIdToken()
                    .then((token) => {
                        writeLog(`token : ${token}`);
                        admin.auth().createSessionCookie(token, sessionCookieOptions)
                            .then(
                                (sessionCookie) => {
                                    // Set cookie policy for session cookie.
                                    const options = { maxAge: sessionCookieOptions.expiresIn, httpOnly: true, secure: true };

                                    createSession(sessionCookie, {});
                                    addToken(sessionCookie, SESSION_KEYS.UID, user!.uid);
                                    addToken(sessionCookie, SESSION_KEYS.ACCESS_TOKEN, token);
                                    addToken(sessionCookie, SESSION_KEYS.REFRESH_TOKEN, user!.refreshToken);

                                    res.status(201).cookie("__session", sessionCookie, options)
                                        .json({
                                                data:{
                                                    user,
                                                    token
                                                }
                                            }
                                        );
                                },
                                (error) => {
                                    throw new HttpException(`UNAUTHORIZED REQUEST!`, JSON.stringify(error), 401);
                                }
                            );
                }).catch((error) => {
                    writeError(`Could not create token for the user ${email}`);
                    writeError(`Error ${JSON.stringify(error)}`);
                    throw new HttpException(`Could not create token for the user ${email}`, JSON.stringify(error));
                })
            }).catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            writeError(`Could not create token for the user ${email}`);
            writeError(`Error ${JSON.stringify(error)}`);

            throw new HttpException(`${errorMessage}`, JSON.stringify(error), ["auth/credential-already-in-use", "auth/email-already-in-use"].includes(errorCode) ? 409 : 500);
        })
    })
);

authRouter.post(
    "/login",
    tryCatch((req: Request, res: Response) => {
        const { email, password } = req.body;

        logInWithEmailAndPassword(email, password)
            .then((userCredentials) => {
                const user = userCredentials.user;
                user!.getIdToken()
                    .then((token) => {
                        writeLog(`token : ${token}`);
                        // Set session expiration to 5 days.
                        const sessionCookieOptions = { expiresIn: 60 * 60 * 24 * 5 * 1000} as SessionCookieOptions;
                        admin.auth().createSessionCookie(token, sessionCookieOptions)
                            .then(
                                (sessionCookie) => {
                                    // Set cookie policy for session cookie.
                                    const options = { maxAge: sessionCookieOptions.expiresIn, httpOnly: true, secure: true };

                                    createSession(sessionCookie, {});
                                    addToken(sessionCookie, SESSION_KEYS.UID, user!.uid);
                                    addToken(sessionCookie, SESSION_KEYS.ACCESS_TOKEN, token);
                                    addToken(sessionCookie, SESSION_KEYS.REFRESH_TOKEN, user!.refreshToken);

                                    res.status(200).cookie("__session", sessionCookie, options)
                                        .json({
                                                data:{
                                                    user,
                                                    token
                                                }
                                            }
                                        );
                                },
                                (error) => {
                                    throw new HttpException(`UNAUTHORIZED REQUEST!`, JSON.stringify(error), 401);
                                }
                            );
                }).catch((error) => {
                    throw new HttpException(`Could not create token for the user ${email}`, JSON.stringify(error));
                })
            }).catch((error) => {
            throw new HttpException(`Could not login the user ${email}`, JSON.stringify(error));
        });
    })
);


authRouter.post(
    "/logout",
    tryCatch((req: Request, res: Response) => {
        const { __session } = req.cookies;
        const userId = getToken(__session, SESSION_KEYS.UID);
        clearSession(__session);
        admin.auth().revokeRefreshTokens(userId).then(()=>{
            res.status(302).redirect("https://darryltadmi-todo-list-angular.web.app/signin/");
        }).catch((error) => {
            throw new HttpException(`Could not logout the user ${userId}`, JSON.stringify(error));
        });
    })
);