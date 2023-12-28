// All available logging functions
import {log, info, debug, warn, error} from "firebase-functions/logger";

export const writeLog = (message: string) => {
    log(message);
    console.log(message);
}
export const writeInfo = (message: string) => {
    info(message);
    console.info(message);
}
export const writeDebug = (message: string) => {
    debug(message);
    console.debug(message);
}
export const writeWarn = (message: string) => {
    warn(message);
    console.warn(message);
}
export const writeError = (message: string) => {
    error(message);
    console.error(message);
}