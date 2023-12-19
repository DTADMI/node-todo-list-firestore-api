/**
 * Required External Modules
 */

import * as dotenv from "dotenv";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import { tasksRouter } from "./tasks/tasks.router.js";
import { errorHandler } from "./middleware/error.middleware.js";
import * as functions from "firebase-functions";


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
    limit: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
    standardHeaders: 'draft-7', // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
    // store: ... , // Use an external store for consistency across multiple server instances.
})

app.use(limiter)
app.use(helmet());
app.use(compression());
app.use(cors());
app.use(express.json());
app.use("/api/todolist/tasks", tasksRouter);

app.use(errorHandler);

/**
 * Server Activation
 */

app.listen(SERVER_PORT, () => {
    console.log(`Listening on port ${SERVER_PORT}`);
});

exports.api = functions.https.onRequest(app);