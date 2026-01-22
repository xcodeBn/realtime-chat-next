// server.ts
import { Elysia, t } from 'elysia'
import {nanoid} from "nanoid";
import {redis} from "@/lib/redis";
import {authMiddleware} from "@/app/api/[[...slugs]]/auth";
import {z} from "zod";
import {awaitExpression} from "@babel/types";

const ROOM_TTL_SECONDS = 60 * 10 // 1 hour

const rooms = new Elysia({prefix: "/room"})
    .post("/create", async ()=>{
        const roomId = nanoid()
        await redis.hset(`meta:${roomId}`,{
            connected: [],
            createdAt: Date.now()
        })
        console.log("Create a new room")
        await redis.expire(`meta:${roomId}`,ROOM_TTL_SECONDS)

        return {roomId}
    })

const messages = new Elysia({prefix:"/messages"}).use(authMiddleware).post("/", async ({body,auth})=>{
    const {sender,text} = body
    const roomExists = await redis.exists
    (`meta:${auth.roomId}`)
    if(!roomExists){
        throw new Error("Room does not exist")
    }

},{
    query: z.object({
        roomId: z.string()
    }),
    body: z.object({
        sender: z.string().max(100),
        text: z.string().max(1000)
    })
})




const app = new Elysia({ prefix: "/api" }).use(rooms).use(messages)

export const GET = app.fetch
export const POST = app.fetch
export const DELETE = app.fetch

export type App = typeof app