/**
 * Required External Modules
 */

import * as dotenv from "dotenv";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { tasksRouter } from "./tasks/tasks.router.js";
import { errorHandler } from "./middleware/error.middleware.js";
import * as functions from "firebase-functions";
import {authRouter} from "./auth/authRouter";
import {authorizationHandler} from "./middleware/auth.middleware";
import {writeLog} from "./common/logger.service";


dotenv.config();

/**
 * App Variables
 */

if (!process.env.SERVER_PORT) {
    process.exit(1);
}

const SERVER_PORT: number = process.env.SERVER_PORT ? parseInt(process.env.SERVER_PORT, 10) : 7777;

const app = express();

/**
 *  App Configuration
 */

/**
 *  Rate limiting
 *  */
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 50, // Limit each IP to 50 requests per `window` (here, per 15 minutes).
    standardHeaders: 'draft-7', // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
    // store: ... , // Use an external store for consistency across multiple server instances.
});

const corsOptions = {
    origin: process.env.SERVER_BASE_URL_CLIENT,
    credentials: true
}

app.use(morgan('combined'));
app.use(limiter);
app.use(helmet());
app.use(compression());
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.set('trust proxy', 2);
app.get('/ip', (request, response) => response.send(request.ip));
app.get('/x-forwarded-for', (request, response) => response.send(request.headers['x-forwarded-for']))

app.use("/auth", authRouter);
app.use(authorizationHandler);
app.use("/todolist/tasks", tasksRouter);

app.use(errorHandler);

/**
 * Server Activation
 */

exports.api = functions.https.onRequest(app);

app.listen(SERVER_PORT, () => {
    writeLog(`Listening on port ${SERVER_PORT}`);
});
