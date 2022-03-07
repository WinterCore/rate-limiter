import { type ConnInfo } from "http/server.ts";

export interface RateLimitInfo {
    readonly limit: number;
    readonly remaining: number;
    readonly reset: number;
}

export const calculateKey = (connInfo: ConnInfo, key = ""): string | undefined => {
    const { remoteAddr } = connInfo;

    if (remoteAddr.transport === 'tcp') {
        return `${key}${remoteAddr.hostname}`;
    }

    return undefined;
};
