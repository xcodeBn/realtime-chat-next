// client.ts
import { treaty } from '@elysiajs/eden'
import type { App } from '@/app/api/[[...slugs]]/route'

function getBaseUrl() {
    if (typeof window !== 'undefined') {
        return window.location.origin;
    }
    if (process.env.NEXT_PUBLIC_APP_URL) {
        return process.env.NEXT_PUBLIC_APP_URL;
    }
    return 'http://localhost:3000';
}

function getHeaders(): Record<string, string> | undefined {
    if (typeof window !== 'undefined') {
        const url = localStorage.getItem("custom_redis_url");
        const token = localStorage.getItem("custom_redis_token");
        if (url && token) {
            return {
                'x-custom-redis-url': url,
                'x-custom-redis-token': token
            };
        }
    }
    return undefined;
}

export const client = treaty<App>(getBaseUrl(), {
    headers: getHeaders
})



