import {writeLog} from "./logger.service";
import {auth} from "firebase-admin";
import SessionCookieOptions = auth.SessionCookieOptions;

/**
 * Cookie Session initialization
 * **/
export type Session = {
    accessToken? : string,
    refreshToken? : string,
    csrfToken? : string,
    uid? : string
}

// Set session expiration to 1 hour.
const seconds = 60, minutes = 60, hours = 1, days = 1, millisecondsRatio = 1000;
export const sessionCookieOptions = { expiresIn: seconds * minutes * hours * days * millisecondsRatio} as SessionCookieOptions;

const SESSION: Map<string, Session> = new Map();
export const SESSION_KEYS = {
    SESSION_TOKEN : "sessionToken",
    ACCESS_TOKEN : "accessToken",
    REFRESH_TOKEN : "refreshToken",
    CSRF_TOKEN : "csrfToken",
    UID: "User ID"
}

export const createSession = (sessionToken: string, session: Session) : Session => {
    writeLog(`Creating session : ${JSON.stringify(session)}`);
    if(!SESSION.has(sessionToken)){
        SESSION.set(sessionToken, session || {} as Session);
    } else {
        const newSession = {...SESSION.get(sessionToken), ...session};
        SESSION.set(sessionToken, newSession);
    }
    const result = SESSION.get(sessionToken)!;
    writeLog(`Created session : ${JSON.stringify(result)}`);
    return result;
}

export const addToken = (sessionToken: string, tokenKey: string, tokenValue: string) => {
    writeLog(`Adding token ${tokenKey} of value ${tokenValue} to session ${JSON.stringify(sessionToken)}`);
    if(!SESSION.has(sessionToken)){
        createSession(sessionToken, {} as Session);
    }
    const session = SESSION.get(sessionToken)!;
    session[tokenKey] = tokenValue;
    writeLog(`New session : ${JSON.stringify(session)}`);
}

export const revokeToken = (sessionToken: string, tokenKey: string) => {
    if(SESSION.has(sessionToken)){
        const session = SESSION.get(sessionToken)!;
        session[tokenKey] = "";
        writeLog(`Revoked session : ${JSON.stringify(session)}`);
    }
}

export const getSession = (sessionToken: string): Session => {
    return SESSION.has(sessionToken) ? SESSION.get(sessionToken)! : createSession(sessionToken, {});
}

export const getToken = (sessionToken: string, tokenKey: string): string => {
    return SESSION.has(sessionToken) ? SESSION.get(sessionToken)![tokenKey] : "";
}

export const clearSession = (sessionToken: string) => {
    SESSION.delete(sessionToken);
}