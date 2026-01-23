// server.ts
import { Elysia, t } from 'elysia'
import {nanoid} from "nanoid";
import {redis} from "@/lib/redis";
import {authMiddleware} from "@/app/api/[[...slugs]]/auth";
import {z} from "zod";
import {awaitExpression} from "@babel/types";
import {Message, realtime} from "@/lib/realtime";
import {queue} from "sharp";
import crypto from "node:crypto";

const ROOM_TTL_SECONDS = 60 * 10 // 1 hour

function hashPassword(password: string): string {
    return crypto.createHash('sha256').update(password).digest('hex');
}

const rooms = new Elysia({prefix: "/room"})
    .post("/create", async ({body})=>{
        const {capacity, password} = body
        const roomId = nanoid()
        
        const roomData: Record<string, any> = {
            connected: [],
            createdAt: Date.now(),
            capacity: capacity
        };

        if (password && password.trim().length > 0) {
            roomData.passwordHash = hashPassword(password);
        }

        await redis.hset(`meta:${roomId}`, roomData)
        
        console.log("Create a new room")
        await redis.expire(`meta:${roomId}`,ROOM_TTL_SECONDS)

        return {roomId}
    }, {
        body: t.Object({
            capacity: t.Number({default:2, minimum:2, maximum:10}),
            password: t.Optional(t.String())
        })
    })
    .post("/verify", async ({body, cookie: { "x-auth-token": tokenCookie }}) => {
        const {roomId, password} = body;
        const meta = await redis.hgetall<{connected:string[], capacity: number, passwordHash: string}>(`meta:${roomId}`);
        
        if (!meta) throw new Error("Room not found");
        
        // Check password if it exists
        if (meta.passwordHash) {
             const providedHash = hashPassword(password);
             if (meta.passwordHash !== providedHash) {
                 throw new Error("Invalid password");
             }
        }
        
        // Check capacity
        const capacity = meta.capacity || 2;
        if (meta.connected.length >= capacity) {
            throw new Error("Room is full");
        }
        
        // Generate Token and Join
        const token = nanoid();
        
        tokenCookie.set({
            value: token,
            path: "/",
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict"
        });
        
        await redis.hset(`meta:${roomId}`, {
            connected: [...meta.connected, token]
        });
        
        return { valid: true };
    }, {
        body: t.Object({
            roomId: t.String(),
            password: t.String()
        })
    })
    .use(authMiddleware).get("/ttl", async ({auth})=>{
        const ttl = await redis.ttl(`meta:${auth.roomId}`)
        return {ttl: ttl>0 ? ttl : 0}
    },{query:z.object({roomId:z.string()})})
    .delete("/",async ({auth})=>{

        await realtime.channel(auth.roomId).emit("chat.destroy",{
            isDestroyed:true
        })

         await Promise.all(
             [
                 redis.del(`meta:${auth.roomId}`),
                 redis.del(`messages:${auth.roomId}`),
                 redis.del(`connections:${auth.roomId}`)
             ]
         )

      //  await redis.del(`history:${auth.roomId}`)
    }, {query:z.object({roomId:z.string()})})

const messages = new Elysia({prefix:"/messages"}).use(authMiddleware).post("/", async ({body,auth})=>{
    const {sender,text} = body
    const roomExists = await redis.exists
    (`meta:${auth.roomId}`)
    if(!roomExists){
        throw new Error("Room does not exist")
    }
    const message:Message = {
        id: nanoid(),
        sender,
        text,
        timeStamp: Date.now(),
        roomId: auth.roomId
    }

    // add message to history
    await redis.rpush(`messages:${auth.roomId}`,{
        ...message, token:auth.token
    })
    await realtime.channel(auth.roomId).emit("chat.message",message)

    // house keeping
    const remaining  = await redis.ttl(`meta:${auth.roomId}`)

    await redis.expire(`messages:${auth.roomId}`,remaining)
    await redis.expire(`history:${auth.roomId}`, remaining)
    await redis.expire(`${auth.roomId}`, remaining)

},{
    query: z.object({
        roomId: z.string()
    }),
    body: z.object({
        sender: z.string().max(100),
        text: z.string().max(1000)
    })
}).get("/", async ({auth})=>{
    const messages = await redis.lrange<Message>(`messages:${auth.roomId}`,0,-1)

    return {
        messages: messages.map((m)=>({
            ...m,
            token: m.token===auth.token ? m.token : undefined
        }))
    }
}, {
    query: z.object({
        roomId: z.string()
    })
})




const app = new Elysia({ prefix: "/api" }).use(rooms).use(messages)

export const GET = app.fetch
export const POST = app.fetch
export const DELETE = app.fetch

export type App = typeof app