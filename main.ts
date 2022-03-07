import { serve, type ConnInfo } from "http/server.ts";
import { initRedis } from "./lib/redis.ts";

import { rateLimit as tokenBucket } from "./impl/token-bucket.ts";
import { calculateKey } from "./impl/shared.ts";

const PORT = 8080;

const redis = await initRedis();

const throttler = async (_request: Request, connInfo: ConnInfo): Promise<Response | undefined> => {
    const key = calculateKey(connInfo);

    if (! key) {
        return new Response("Unidentifable request", { status: 400 });
    }

    const info = await tokenBucket(redis, key);

    if (info) {
        console.log('Rate limited', info);

        return new Response(JSON.stringify({ error: "Too many requests" }), {
            status: 429,
            headers: {
                "Content-Type": "application/json",
                "X-Rate-Limit-Limit": `${info.limit}`,
                "X-Rate-Limit-Remaining": `${info.remaining}`,
                "X-Rate-Limit-Reset": `${info.reset}`,
            },
        });
    }

};

const handler = async (request: Request, connInfo: ConnInfo): Promise<Response> => {
    const throttleResponse = await throttler(request, connInfo);

    if (throttleResponse) {
        return throttleResponse;
    }

    const response = await fetch("https://api.github.com/users/wintercore");

    return new Response(response.body, {
        status: response.status,
        headers: response.headers,
    });
};

console.log(`Up and running on port ${PORT}`);

await serve(handler, { port: PORT });

