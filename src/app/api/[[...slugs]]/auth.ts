import {Elysia} from "elysia";
import {getRedis} from "@/lib/redis";

class AuthError extends Error{
    constructor(message: string) {
        super(message);
        this.name = "AuthError";
    }
}

export const authMiddleware = new Elysia({
    name: "auth",
}).error({AuthError})
.onError(({code, set}) => {
    if(code==="AuthError"){
        set.status = 401;
        return {error: "Unauthorized"};
    }
})
.derive(
    {
        as:"scoped"
    },
    async ({query,cookie, request})=>{
        const roomId = query.roomId;
        const token = cookie["x-auth-token"].value as string | undefined;

        if(!token || !roomId){
            throw new AuthError("Missing roomId or token");
        }

        const redis = getRedis(request.headers);
        const connected = await redis.hget<string[]>(`meta:${roomId}`,"connected")
        if(!connected || !connected.includes(token)){
            throw new AuthError("Invalid token for the room");
        }

        return {
            auth: {
                roomId, token, connected
            }
        }

    }
)