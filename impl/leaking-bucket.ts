import { type Redis } from "redis/mod.ts";
import { RateLimitInfo } from "./shared.ts";

const CONFIG = {
    rate: 5, // The processing rate
    burst: 20, // The size of the FIFO queue
    nodelay: false, // Allow consecutive requests sent in a short period of time to fill up the queue without spacing them
};

const LIMIT = CONFIG.burst + CONFIG.rate;

const ONE_MINUTE_MS = 1000 * 60;

const isAfter = (ts: number) => (x: number) => x > ts;
const toNumber = (x: string): number => +x;

// 1. Request comes in
// 

export const rateLimit = async (store: Redis, key: string): Promise<RateLimitInfo | undefined> => {
    const queue = await store.lrange(key, 0, -1) || [];
    
    const lastMinuteRequests = queue
        .map(toNumber)
        .filter(x => ! isNaN(x))
        .filter(isAfter(Date.now() - ONE_MINUTE_MS))

    if (CONFIG.nodelay) {
        if (lastMinuteRequests.length > LIMIT) {
            // Fail
        } else {
            
        }
    }


    return undefined;
};




/*
 * We need 2 redis entries for each ip address
 * 1. Request comes in
 * 2. Check the queue for that specific IP
 *
 *
 */
