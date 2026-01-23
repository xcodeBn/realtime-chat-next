import {NextRequest, NextResponse} from "next/server";
import {redis} from "@/lib/redis";
import {nanoid} from "nanoid";

export async function proxy(req:NextRequest){
    const pathName = req.nextUrl.pathname;
    const roomMatch = pathName.match(/^\/room\/([^\/]+)(\/.*)?$/);
    if(!roomMatch){
        return NextResponse.redirect(new URL("/",req.url));
    }
    const roomId = roomMatch[1];
    const meta = await redis.hgetall<{connected:string[],createdAt:number, capacity?:number, passwordHash?: string}>(`meta:${roomId}`)

    if(!meta){
        return NextResponse.redirect(new URL("/?error=room-not-found",req.url));
    }

    const existingToken = req.cookies.get("x-auth-token")?.value;
    if(existingToken && meta.connected.includes(existingToken)){
        return NextResponse.next();
    }
    
    // If room is password protected and user is not connected, redirect to login
    // BUT we must allow the login page itself to be accessed.
    // The matcher is /room/:path*, so /room/123/login is also intercepted.
    if(req.nextUrl.pathname.endsWith("/login")) {
         return NextResponse.next();
    }

    if (meta.passwordHash) {
        return NextResponse.redirect(new URL(`/room/${roomId}/login`, req.url));
    }
    
    const roomCapacity = meta.capacity || 2;
    if(meta.connected.length>= roomCapacity){
        return NextResponse.redirect(new URL("/?error=room-full",req.url));
    }

    const response = NextResponse.next();
    const token = nanoid()
    response.cookies.set("x-auth-token",token,{
        path: "/",
        httpOnly : true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict"
    })

    await redis.hset(`meta:${roomId}`,{
        connected: [...meta.connected, token]
    })
    return response;
}

export const config = {
    matcher: '/room/:path*'
}
