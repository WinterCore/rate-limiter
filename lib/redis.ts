import { connect } from "redis/mod.ts";

export const initRedis = async () => await connect({
    hostname: "127.0.0.1",
    maxRetryCount: 10
});

