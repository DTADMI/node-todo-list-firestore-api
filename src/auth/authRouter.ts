/**
 * Required External Modules
 */

import express, {Request, Response} from "express";
//import cors from "cors";
import {tryCatch} from "../utils/tryCatch";
import HttpException from "../common/http-exception";
import {logInWithEmailAndPassword, signUpWithEmailAndPassword} from "../common/firebase";



/**
 * App Variables
 */

export const authRouter = express.Router();
/**
 *  App Configuration
 */
/*
const whitelist = [process.env.CLIENT_URL];

const corsOptions = {
  origin: (origin, callback) => {
      if(whitelist.indexOf(origin) !== -1){
          callback(null, true);
      } else {
          callback(new Error("Not allowed by CORS"));
      }
  }
};

authRouter.use(cors(corsOptions));*/


authRouter.post(
    "/register",
    tryCatch((req: Request, res: Response) => {
        const { email, password } = req.body;
        console.log(`register email : ${email} password : ${password}`);
        signUpWithEmailAndPassword(email, password)
            .then((userCredentials) => {
                const user = userCredentials.user;
                console.log(`userCredentials : ${JSON.stringify(user)}`);
                user!.getIdToken()
                    .then((token) => {
                        console.log(`token : ${token}`);
                        res.status(201)
                            .json({
                                data:{
                                    user,
                                    token
                                }
                            }
                        );
                }).catch((error) => {
                    console.error(`Could not create token for the user ${email}`);
                    console.error(`Error ${JSON.stringify(error)}`);

                    throw new HttpException(`Could not create token for the user ${email}`, JSON.stringify(error));
                })
            }).catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            console.error(`Could not create token for the user ${email}`);
            console.error(`Error ${JSON.stringify(error)}`);

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
