
// message, destroy


import {z} from "zod";
import {InferRealtimeEvents, Realtime} from "@upstash/realtime";
import {redis} from "@/lib/redis";
const message = z.object({
    id: z.string(),
    sender: z.string().max(100),
    text: z.string().max(500),
    timeStamp: z.number(),
    roomId: z.string(),
    token: z.string().optional()
})
const schema = {
    chat: {
        message: message,
        destroy: z.object({
            isDestroyed: z.literal(true)
        })
    }
}


export const realtime  = new Realtime({schema,redis})
export type RealTimeEvents = InferRealtimeEvents<typeof realtime>
export type Message = z.infer<typeof message>;


