import { type Redis } from "redis/mod.ts";
import { RateLimitInfo } from "./shared.ts";

const CONFIG = {
    bucketSize: 5,
    refillRate: 4 / 60, // Per second (4 per minute)
};

interface TokenBucketValue {
    readonly tokens: number;
    readonly timestamp: number;
}

const parseValue = (val: string): TokenBucketValue => {
    const [tokensStr, timestampStr] = val.split(':');

    const [tokens, timestamp] = [+tokensStr, +timestampStr];

    if (isNaN(tokens) || isNaN(timestamp)) {
        throw new Error('Unable to parse value');
    }

    return { tokens, timestamp };
};

const stringifyValue = ({ timestamp, tokens }: TokenBucketValue): string => `${tokens}:${timestamp}`;

const refillTokens = ({ tokens, timestamp }: TokenBucketValue): number => {
    const now = Date.now();

    return Math.min(CONFIG.bucketSize, tokens + CONFIG.refillRate * ((now - timestamp) / 1000));
};

export const rateLimit = async (store: Redis, key: string): Promise<RateLimitInfo | undefined> => {
    const now = Date.now();
    const value = await store.get(key) || `${CONFIG.bucketSize}:${now}`;

    const tbValue = parseValue(value);
    const newTokens = refillTokens(tbValue);


    if (newTokens < 1) {
        const newValue = stringifyValue({ timestamp: now, tokens: newTokens });
        await store.set(key, newValue, { ex: 60 });

        return {
            limit: CONFIG.bucketSize,
            remaining: Math.floor(newTokens),
            reset: now + Math.ceil((1 - newTokens) / CONFIG.refillRate * 1000),
        };
    }

    const newValue = stringifyValue({ timestamp: now, tokens: newTokens - 1 });
    await store.set(key, newValue, { ex: 60 });


    return undefined;
}
