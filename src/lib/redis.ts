import {Redis} from "@upstash/redis";

const defaultRedis = Redis.fromEnv();

export const redis = defaultRedis;

export const getRedis = (headers?: Headers) => {
    if (!headers) return defaultRedis;

    const url = headers.get("x-custom-redis-url");
    const token = headers.get("x-custom-redis-token");

    if (url && token) {
        return new Redis({
            url,
            token
        });
    }

    return defaultRedis;
}