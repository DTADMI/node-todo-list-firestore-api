import NodeCache from "node-cache";

/**
 * Cache initialization
 * **/
export const cache = new NodeCache( { stdTTL: 120, checkperiod: 600 } );
export const CACHE_KEYS = {
    ALL_TASKS : "All tasks",
    USER_TASKS: "User tasks"
}

export const deleteCache = (cacheKey: string) => {
    cache.del(cacheKey);
}

export const clearAllCache = () => {
    for (const cacheKey of Object.keys(CACHE_KEYS)) {
        cache.del(cacheKey);
    }
}