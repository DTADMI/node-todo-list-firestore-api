/**
 * Required External Modules
 */

import express, {Request, Response} from "express";
import {tryCatch} from "../utils/tryCatch";
import HttpException from "../common/http-exception";
import {logInWithEmailAndPassword, signUpWithEmailAndPassword} from "../common/firebase";
import {writeError, writeLog} from "../common/logger.service";



/**
 * App Variables
 */

export const authRouter = express.Router();
/**
 *  App Configuration
 */

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
                        res.status(201)
                            .json({
                                data:{
                                    user,
                                    token
                                }
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
                        res.status(200)
                            .json({
                                data:{
                                    user,
                                    token
                                }
                            }
                        );
                }).catch((error) => {
                    throw new HttpException(`Could not create token for the user ${email}`, JSON.stringify(error));
                })
            }).catch((error) => {
            throw new HttpException(`Could not login the user ${email}`, JSON.stringify(error));
        })
    })
);
